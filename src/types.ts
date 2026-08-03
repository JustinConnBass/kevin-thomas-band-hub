export type Role='Administrator'|'Bandleader'|'Band member'|'Production crew'|'Substitute musician';
export type User={id:string;name:string;email:string;role:Role;instrument:string;initials:string};
export type Song={id:string;title:string;artist:string;key:string;bpm:number;duration:string;feel:string;chart:string;notes:string;tags:string[]};
export type Availability='available'|'unavailable'|'maybe'|'pending';
export type Gig={id:string;title:string;venue:string;address:string;date:string;doors:string;soundcheck:string;downbeat:string;status:string;setlist:string[];availability:Record<string,Availability>;itinerary:{time:string;label:string}[];advance:string;fee?:number};

