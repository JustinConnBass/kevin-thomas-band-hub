import type {Gig,Song,User} from './types';
export const users:User[]=[
 {id:'u1',name:'Jordan Ellis',email:'admin@ktb-demo.example',role:'Administrator',instrument:'Keys',initials:'JE'},
 {id:'u2',name:'Kevin Thomas',email:'leader@ktb-demo.example',role:'Bandleader',instrument:'Vocals / Guitar',initials:'KT'},
 {id:'u3',name:'Maya Brooks',email:'member@ktb-demo.example',role:'Band member',instrument:'Bass',initials:'MB'},
 {id:'u4',name:'Theo Grant',email:'crew@ktb-demo.example',role:'Production crew',instrument:'FOH Engineer',initials:'TG'},
 {id:'u5',name:'Sam Rivera',email:'sub@ktb-demo.example',role:'Substitute musician',instrument:'Drums',initials:'SR'}
];
export const songs:Song[]=[
 {id:'s1',title:'Midnight on Main',artist:'Kevin Thomas Band',key:'A',bpm:112,duration:'4:08',feel:'Driving soul',tags:['Original','Opener'],chart:'A | 1 . 4 . | 1 . 5 . |\nV | 1 . . . | 4 . . . | 6- . 5 . | 1 . . . |\nC | 4 . . . | 1 . . . | 5 . 4 . | 1 . . . |',notes:'Watch Kevin for the stop after chorus two.'},
 {id:'s2',title:'Riverlight',artist:'Kevin Thomas Band',key:'E',bpm:76,duration:'5:12',feel:'6/8 ballad',tags:['Original','Feature'],chart:'I | 1 . . | 5/7 . . | 6- . . | 4 . . |\nC | 1 . . | 5 . . | 4 . . | 1 . . |',notes:'Build from brushes; full kit at final chorus.'},
 {id:'s3',title:'Ain’t No Sunshine',artist:'Bill Withers',key:'Am',bpm:78,duration:'2:42',feel:'Pocket',tags:['Cover'],chart:'V | 1- . . . | 5- . . . | 1- . . . |\nB | 1- . . . | b7 . . . | b6 . 5 . |',notes:'Short ending, no vamp.'},
 {id:'s4',title:'Hard to Handle',artist:'Otis Redding',key:'G',bpm:104,duration:'3:36',feel:'Memphis soul',tags:['Cover','Dance'],chart:'I | 1 . b3 4 | 1 . b7 4 |\nV | 1 . . . | 4 . . . | 1 . . . | 5 . 4 . |',notes:'Horn hits in second verse.'},
 {id:'s5',title:'Northbound',artist:'Kevin Thomas Band',key:'D',bpm:126,duration:'4:24',feel:'Americana',tags:['Original'],chart:'I | 1 . . . | 4 . . . |\nV | 1 . 5 . | 6- . 4 . |\nC | 4 . 1 . | 5 . 6- . |',notes:'Count in: 1, 2, 1-2-3-4.'},
 {id:'s6',title:'Use Me',artist:'Bill Withers',key:'Em',bpm:82,duration:'4:01',feel:'Deep funk',tags:['Cover','Closer'],chart:'Riff | 1- . . . | . . b3 4 |\nB | 4 . . . | 1- . . . | 5 . 4 . |',notes:'Open solos after bridge.'}
];
export const gigs:Gig[]=[{id:'g1',title:'Friday Night at The Foundry',venue:'The Foundry Room',address:'114 Market St, Raleigh, NC',date:'2026-08-07',doors:'7:00 PM',soundcheck:'5:15 PM',downbeat:'8:30 PM',status:'Confirmed',setlist:['s1','s4','s2','s3','s5','s6'],availability:{u1:'available',u2:'available',u3:'available',u4:'available',u5:'pending'},itinerary:[{time:'4:30 PM',label:'Crew load-in'},{time:'5:15 PM',label:'Soundcheck'},{time:'6:00 PM',label:'Band meal'},{time:'7:00 PM',label:'Doors'},{time:'8:30 PM',label:'Set one'},{time:'10:00 PM',label:'Set two'}],advance:'House PA. Band carries backline. Four monitor mixes. Parking via loading alley.',fee:1800},{id:'g2',title:'Summer Courtyard Series',venue:'Hawthorne Arts Center',address:'22 Hawthorne Ave, Durham, NC',date:'2026-08-22',doors:'6:00 PM',soundcheck:'4:00 PM',downbeat:'7:00 PM',status:'Hold',setlist:['s5','s1','s3','s4'],availability:{u1:'maybe',u2:'available',u3:'pending',u4:'available',u5:'available'},itinerary:[{time:'3:15 PM',label:'Load-in'},{time:'4:00 PM',label:'Soundcheck'},{time:'7:00 PM',label:'Show'}],advance:'Outdoor covered stage. Rain call by noon.',fee:2200}];

