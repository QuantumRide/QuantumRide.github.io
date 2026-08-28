const MV="Indian/Maldives";
const REG={
  "north-male":[4.33,73.61],"south-male":[3.95,73.5],meemu:[2.92,73.58],thaa:[2.37,72.94],
  laamu:[1.816,73.428],"gaafu-north":[0.756,73.434],"gaafu-east":[0.256,73.357],
  "gaafu-west":[0.22,73.09],"gaafu-south":[0.227,73.274],addu:[-0.627,73.147]
};
const AT=[
  ["north-male","N. Malé"],["south-male","S. Malé"],["meemu","Meemu"],["thaa","Thaa"],
  ["laamu","Laamu"],["gaafu-alifu","G. Alifu"],["gaafu","G. Dhaalu"],["addu","Addu"]
];
const S=(o)=>({skill:"advanced",tide:"mid-high",min:0.7,max:2.4,wrap:1.05,chan:false,...o});
const SPOTS=[
  S({slug:"pasta-point",n:"Pasta Point",isl:"Chaalos",a:"north-male",fk:"north-male",lat:4.31,lon:73.62,brk:"left",sw:[140,200],off:[10,80],min:.6,max:2.2,wrap:1.12}),
  S({slug:"sultans",n:"Sultans",isl:"Thulusdhoo",a:"north-male",fk:"north-male",lat:4.374,lon:73.651,brk:"right",sw:[140,210],off:[240,310],wrap:1.08}),
  S({slug:"honkys",n:"Honkys",isl:"Thulusdhoo",a:"north-male",fk:"north-male",lat:4.372,lon:73.648,brk:"right",sw:[150,210],off:[250,320],tide:"low",wrap:.98}),
  S({slug:"jailbreaks",n:"Jailbreaks",isl:"Thulusdhoo",a:"north-male",fk:"north-male",lat:4.37,lon:73.64,brk:"right",sw:[150,220],off:[250,320],min:.9,wrap:1.1,chan:true}),
  S({slug:"cokes",n:"Cokes",isl:"Koks",a:"north-male",fk:"north-male",lat:4.307,lon:73.627,brk:"right",sw:[140,200],off:[300,20],min:.8,max:2.0,tide:"high",wrap:1.18,skill:"expert",chan:true}),
  S({slug:"chickens",n:"Chickens",isl:"Kani",a:"north-male",fk:"north-male",lat:4.29,lon:73.36,brk:"right",sw:[160,220],off:[250,330],wrap:1.0}),
  S({slug:"lohis",n:"Lohis",isl:"Lhohifushi",a:"north-male",fk:"north-male",lat:4.43,lon:73.72,brk:"left",sw:[140,200],off:[20,90],wrap:1.06}),
  S({slug:"ninjas",n:"Ninjas",isl:"Kanifinolhu",a:"north-male",fk:"north-male",lat:4.31,lon:73.72,brk:"left",sw:[150,210],off:[10,80],wrap:1.0}),
  S({slug:"tombstones",n:"Tombstones",isl:"Furanafushi",a:"north-male",fk:"north-male",lat:4.25,lon:73.55,brk:"right",sw:[150,210],off:[260,330],skill:"expert",wrap:1.15}),
  S({slug:"towns",n:"Towns",isl:"Malé",a:"north-male",fk:"north-male",lat:4.175,lon:73.509,brk:"peaks",sw:[140,200],off:[250,330],min:.5,wrap:.9,skill:"intermediate",chan:true}),
  S({slug:"gurus",n:"Gurus",isl:"Gulhi",a:"south-male",fk:"south-male",lat:3.99,lon:73.51,brk:"left",sw:[140,200],off:[20,90],wrap:1.07}),
  S({slug:"quarters",n:"Quarters",isl:"Gulhi",a:"south-male",fk:"south-male",lat:3.985,lon:73.52,brk:"right",sw:[150,210],off:[250,320],wrap:1.04}),
  S({slug:"kates",n:"Kate's",isl:"Guraidhoo",a:"south-male",fk:"south-male",lat:3.90,lon:73.47,brk:"right",sw:[150,210],off:[260,330],wrap:1.02}),
  S({slug:"twin-peaks",n:"Twin Peaks",isl:"Guraidhoo",a:"south-male",fk:"south-male",lat:3.905,lon:73.475,brk:"peaks",sw:[140,210],off:[250,330],wrap:1.0}),
  S({slug:"foxys",n:"Foxys",isl:"Guraidhoo",a:"south-male",fk:"south-male",lat:3.901,lon:73.468,brk:"left",sw:[140,200],off:[20,100],wrap:1.06}),
  S({slug:"kandooma",n:"Kandooma",isl:"Kandooma",a:"south-male",fk:"south-male",lat:3.90,lon:73.47,brk:"right",sw:[150,220],off:[250,330],wrap:1.14,skill:"expert",chan:true}),
  S({slug:"riptides",n:"Riptides",isl:"Guraidhoo channel",a:"south-male",fk:"south-male",lat:3.903,lon:73.472,brk:"right",sw:[150,220],off:[250,330],wrap:1.16,skill:"expert",chan:true}),
  S({slug:"veyvah",n:"Veyvah",isl:"Veyvah",a:"meemu",fk:"meemu",lat:2.95,lon:73.60,brk:"right",sw:[70,140],off:[200,280],min:1.0,wrap:1.08,chan:true}),
  S({slug:"muli",n:"Muli",isl:"Muli",a:"meemu",fk:"meemu",lat:2.92,lon:73.58,brk:"right",sw:[80,150],off:[210,290],min:1.0,wrap:1.05}),
  S({slug:"bowling-alley",n:"Bowling Alley",isl:"Vandhoo",a:"thaa",fk:"thaa",lat:2.37,lon:72.94,brk:"left",sw:[200,260],off:[20,90],min:.9,wrap:1.1}),
  S({slug:"yin-yang",n:"Yin Yang",isl:"Gan",a:"laamu",fk:"laamu",lat:1.82,lon:73.43,brk:"peaks",sw:[200,270],off:[350,70],min:.8,wrap:1.09}),
  S({slug:"viligili-left",n:"Viligili Left",isl:"Kooddoo",a:"gaafu-alifu",fk:"gaafu-north",lat:0.73,lon:73.43,brk:"left",sw:[140,210],off:[10,90],wrap:1.07}),
  S({slug:"five-islands",n:"Five Islands",isl:"Fiyoaree rim",a:"gaafu",fk:"gaafu-east",lat:0.256,lon:73.357,brk:"right",sw:[140,210],off:[250,330],min:.9,max:2.6,tide:"high",wrap:1.2,skill:"expert",chan:true}),
  S({slug:"love-charms",n:"Love Charms",isl:"Ayada",a:"gaafu",fk:"gaafu-west",lat:0.27,lon:73.10,brk:"left",sw:[200,260],off:[10,80],wrap:1.12}),
  S({slug:"two-ways",n:"Two Ways",isl:"Ayada",a:"gaafu",fk:"gaafu-west",lat:0.26,lon:73.11,brk:"peaks",sw:[190,250],off:[350,70],wrap:1.08}),
  S({slug:"tiger-stripes",n:"Tiger Stripes",isl:"Ayada",a:"gaafu",fk:"gaafu-west",lat:0.25,lon:73.10,brk:"right",sw:[200,260],off:[250,330],wrap:1.14,skill:"expert"}),
  S({slug:"antiques",n:"Antiques",isl:"Ayada",a:"gaafu",fk:"gaafu-west",lat:0.24,lon:73.09,brk:"right",sw:[200,260],off:[250,330],wrap:1.1}),
  S({slug:"blue-bowls",n:"Blue Bowls",isl:"Vaadhoo",a:"gaafu",fk:"gaafu-south",lat:0.227,lon:73.274,brk:"right",sw:[150,220],off:[260,340],wrap:1.16}),
  S({slug:"beacons",n:"Beacons",isl:"Fiyoari",a:"gaafu",fk:"gaafu-south",lat:0.22,lon:73.25,brk:"right",sw:[150,220],off:[250,330],tide:"high",wrap:1.13}),
  S({slug:"castaways",n:"Castaways",isl:"Gaafu south",a:"gaafu",fk:"gaafu-south",lat:0.21,lon:73.26,brk:"left",sw:[140,210],off:[20,90],wrap:1.05}),
  S({slug:"villingili",n:"Villingili",isl:"Shangri-La",a:"addu",fk:"addu",lat:-0.63,lon:73.15,brk:"right",sw:[160,230],off:[250,330],wrap:1.08}),
  S({slug:"kottey",n:"Kottey",isl:"Hithadhoo",a:"addu",fk:"addu",lat:-0.61,lon:73.09,brk:"left",sw:[140,210],off:[10,90],wrap:1.06})
];
