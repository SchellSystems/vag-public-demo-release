import os, shutil, subprocess, tempfile, unittest
from pathlib import Path
SCRIPT = Path(__file__).resolve().parents[2] / '.github' / 'scripts' / 'check_changed_whitespace.sh'
WORKFLOW = Path(__file__).resolve().parents[2] / '.github' / 'workflows' / 'audit.yml'
ZERO_SHA='0'*40

def run(cmd,cwd,check=True):
    return subprocess.run(cmd,cwd=cwd,check=check,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
def git(cwd,*args): return run(['git',*args],cwd).stdout.strip()
class Repo:
    def __init__(self):
        self.tmp=tempfile.TemporaryDirectory(); self.path=Path(self.tmp.name)/'repo'; self.path.mkdir()
        git(self.path,'init','-b','main'); git(self.path,'config','user.email','ci@example.invalid'); git(self.path,'config','user.name','CI Test')
    def commit(self,text,message):
        (self.path/'sample.txt').write_text(text); git(self.path,'add','sample.txt'); git(self.path,'commit','-m',message); return git(self.path,'rev-parse','HEAD')
    def close(self): self.tmp.cleanup()
class T(unittest.TestCase):
    def setUp(self): self.repo=Repo()
    def tearDown(self): self.repo.close()
    def invoke(self,**env):
        e=os.environ.copy(); e.update(env); return subprocess.run(['bash',str(SCRIPT)],cwd=self.repo.path,env=e,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    def test_clean_pr_diff(self):
        b=self.repo.commit('clean\n','b'); h=self.repo.commit('still clean\n','h'); r=self.invoke(EVENT_NAME='pull_request',BASE_SHA=b,HEAD_SHA=h); self.assertEqual(r.returncode,0,r.stderr)
    def test_pr_diff_with_whitespace(self):
        b=self.repo.commit('clean\n','b'); h=self.repo.commit('bad \n','h'); self.assertNotEqual(self.invoke(EVENT_NAME='pull_request',BASE_SHA=b,HEAD_SHA=h).returncode,0)
    def test_clean_normal_main_push(self):
        b=self.repo.commit('clean\n','b'); a=self.repo.commit('cleaner\n','a'); r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA=b,AFTER_SHA=a); self.assertEqual(r.returncode,0,r.stderr)
    def test_main_push_with_whitespace(self):
        b=self.repo.commit('clean\n','b'); a=self.repo.commit('bad \n','a'); self.assertNotEqual(self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA=b,AFTER_SHA=a).returncode,0)
    def test_squash_merge_push(self):
        b=self.repo.commit('base\n','b'); a=self.repo.commit('squashed clean\n','a'); r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA=b,AFTER_SHA=a); self.assertEqual(r.returncode,0,r.stderr)
    def test_force_push_with_before_present(self):
        base=self.repo.commit('base\n','base'); old=self.repo.commit('old\n','old'); git(self.repo.path,'reset','--hard',base); new=self.repo.commit('new\n','new'); r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA=old,AFTER_SHA=new); self.assertEqual(r.returncode,0,r.stderr)
    def test_force_push_fetches_missing_before(self):
        origin=Path(self.repo.tmp.name)/'origin.git'; git(Path(self.repo.tmp.name),'init','--bare',str(origin)); git(self.repo.path,'remote','add','origin',str(origin))
        before=self.repo.commit('before\n','before'); git(self.repo.path,'push','origin','main'); after=self.repo.commit('after\n','after'); git(self.repo.path,'push','origin','main')
        shallow=Path(self.repo.tmp.name)/'shallow'; run(['git','clone','--depth=1','file:' + '//' + str(origin),str(shallow)],Path(self.repo.tmp.name)); shutil.copy2(SCRIPT,shallow/'check.sh')
        self.assertNotEqual(run(['git','cat-file','-e',f'{before}^{{commit}}'],shallow,check=False).returncode,0)
        e=os.environ.copy(); e.update(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA=before,AFTER_SHA=after)
        r=subprocess.run(['bash','check.sh'],cwd=shallow,env=e,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE); self.assertEqual(r.returncode,0,r.stderr); self.assertIn('attempting targeted fetch',r.stderr)
    def test_unavailable_before_fails_closed(self):
        origin=Path(self.repo.tmp.name)/'origin.git'; git(Path(self.repo.tmp.name),'init','--bare',str(origin)); git(self.repo.path,'remote','add','origin',str(origin)); after=self.repo.commit('after\n','after'); git(self.repo.path,'push','origin','main')
        r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='false',BEFORE_SHA='1'*40,AFTER_SHA=after); self.assertEqual(r.returncode,1); self.assertIn('unavailable after targeted fetch',r.stderr); self.assertNotIn('fatal: bad object',r.stderr)
    def test_ref_deletion_skips_source_diff(self):
        r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='true',BEFORE_SHA='bad',AFTER_SHA='bad'); self.assertEqual(r.returncode,0,r.stderr); self.assertIn('no source diff executed',r.stdout)
    def test_clean_manual_main_dispatch_root_commit(self):
        a=self.repo.commit('clean\n','a'); r=self.invoke(EVENT_NAME='workflow_dispatch',REF_NAME='refs/heads/main',AFTER_SHA=a); self.assertEqual(r.returncode,0,r.stderr)
    def test_manual_main_dispatch_checks_parent_diff(self):
        self.repo.commit('clean\n','b'); a=self.repo.commit('bad \n','a'); self.assertNotEqual(self.invoke(EVENT_NAME='workflow_dispatch',REF_NAME='refs/heads/main',AFTER_SHA=a).returncode,0)
    def test_manual_main_dispatch_checks_merge_first_parent_diff(self):
        self.repo.commit('base\n','base'); git(self.repo.path,'checkout','-b','feature'); self.repo.commit('bad \n','feature'); git(self.repo.path,'checkout','main'); git(self.repo.path,'merge','--no-ff','-m','merge','feature'); a=git(self.repo.path,'rev-parse','HEAD')
        self.assertNotEqual(self.invoke(EVENT_NAME='workflow_dispatch',REF_NAME='refs/heads/main',AFTER_SHA=a).returncode,0)
    def test_manual_dispatch_rejects_non_main_ref(self):
        a=self.repo.commit('clean\n','a'); r=self.invoke(EVENT_NAME='workflow_dispatch',REF_NAME='refs/heads/feature',AFTER_SHA=a); self.assertEqual(r.returncode,1); self.assertIn('must target refs/heads/main',r.stderr)
    def test_invalid_event_variables_fail_clearly(self):
        r=self.invoke(EVENT_NAME='',BASE_SHA='',HEAD_SHA=''); self.assertEqual(r.returncode,1); self.assertIn('EVENT_NAME must be',r.stderr)
        r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/main',DELETED='maybe',BEFORE_SHA=ZERO_SHA,AFTER_SHA='2'*40); self.assertEqual(r.returncode,1); self.assertIn('DELETED must be',r.stderr)
    def test_feature_branch_push_is_out_of_scope(self):
        r=self.invoke(EVENT_NAME='push',REF_NAME='refs/heads/feature',DELETED='false',BEFORE_SHA='bad',AFTER_SHA='bad'); self.assertEqual(r.returncode,0,r.stderr)
    def test_tag_push_is_out_of_scope(self):
        r=self.invoke(EVENT_NAME='push',REF_NAME='refs/tags/v1',DELETED='false',BEFORE_SHA='bad',AFTER_SHA='bad'); self.assertEqual(r.returncode,0,r.stderr)
    def test_workflow_limits_pushes_to_main_and_supports_manual_main_audit(self):
        t=WORKFLOW.read_text(); self.assertIn('push:\n    branches:\n      - main',t); self.assertNotIn('tags:',t); self.assertIn('workflow_dispatch:',t); self.assertIn('AFTER_SHA: ${{ github.event.after || github.sha }}',t); self.assertIn('DELETED: ${{ github.event.deleted }}',t)
if __name__=='__main__': unittest.main()
