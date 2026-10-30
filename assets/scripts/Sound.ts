import { AudioSource, AudioClip, resources, Node, isValid } from 'cc';
export class Sound {
 source:AudioSource;music:AudioSource;upgrade:AudioSource;upgradeActive=false;clips:Record<string,AudioClip>={};ready=false;error='';last=-10;clock=0;
 constructor(parent:Node){this.source=parent.addComponent(AudioSource);this.source.playOnAwake=false;const n=new Node('Music');n.parent=parent;this.music=n.addComponent(AudioSource);this.music.playOnAwake=false;this.music.loop=true;this.music.volume=.35;
  const u=new Node('UpgradeAudio');u.parent=parent;this.upgrade=u.addComponent(AudioSource);this.upgrade.playOnAwake=false;this.upgrade.loop=false;this.upgrade.volume=.65;
  for(const name of ['upgrade','music'])resources.load(name==='music'?'audio/bgm':'audio/upgrade_v01',AudioClip,(err,clip)=>{if(err){if(name==='music'){this.error=String(err);console.error('Background music',err);}return;}if(isValid(parent,true)&&isValid(this.source,true)&&isValid(this.music,true)){this.clips[name]=clip;if(name==='music'){this.music.clip=clip;this.ready=true;}}});
 }
 tick(dt:number,music:boolean){this.clock+=dt;if(music&&this.music.clip&&!this.music.playing)this.music.play();if(!music&&this.music.playing)this.music.pause();}
 play(name:string,enabled:boolean){if(!enabled||!this.clips[name])return;if(name==='cut'&&this.clock-this.last<.12)return;this.last=this.clock;this.source.playOneShot(this.clips[name],name==='cut'?.18:.25);}
 startUpgrade(enabled:boolean){this.upgrade.stop();this.upgrade.clip=this.clips.upgrade;this.upgradeActive=enabled;if(enabled)this.upgrade.play();}
 syncUpgrade(playing:boolean){if(!playing){if(this.upgrade.playing)this.upgrade.pause();return;}if(this.upgradeActive&&!this.upgrade.playing&&this.upgrade.currentTime<this.upgrade.duration-.05)this.upgrade.play();}
 endUpgrade(){this.upgradeActive=false;this.upgrade.stop();}
 stop(){this.music.pause();this.source.stop();this.upgrade.pause();}
}
