/** Curriculum modules catalog ported from Lycee Academics Classes & Modules panel.
 * Source: lycee-academics/backend-app/app/routes/classes_modules.py
 */
const P=s=>s.split("\n").filter(Boolean).map(l=>{const[a,b,c]=l.split("|");return{code:a,title:b,h:+c}});
const COMP5=P(`CMEN502|Use upper-intermediate English at the workplace|30
CCMCZ502|Develop attitudes of living together in harmony|30
CCMBO502|Organise a business|30
CCMFT502|Echanger les idées en français élémentaire|30
CCMKN502|Gukoresha ikinyarwanda k’intyoza|30
CCMKK502|Kutumia Kiswahili katika mawasiliano ya kazini|30
CCMPE502|Apply Professional and multicultural ethics at workplace|30
CCMIW502|Use ICT at Workplace|30`);
const COMP4=P(`CCMBP402|Develop a business plan|30
CCMCS402|Apply computer skills|30
CCMCZ401|Promote the Culture of Peace|30
CCMEN402|Use intermediate English at workplace|30
CCMKN402|Gukoresha ikinyarwanda cy’umunyamwuga|30
CCMFT401|Exprimer des Opinions en Français élémentaire|30`);
const COMP3=P(`CCMOL302|Describe the Occupation and learning process|30
CCMBC302|Create a Business|30
CCMCL302|Apply computer literacy|30
CCMCZ301|Comply With Citizenship Values|30
CCMEN302|Use Pre-intermediate English at the Workplace|30
CCMFR303|Communiquer simplement en français au quotidien|30
CCMHE303|Maintain SHE at Workplace|30
CCMKK302|Kutumia Kiswahili wastani|30
CCMKN302|Gukoresha Ikinyarwanda Kiboneye|30`);
const AP=P(`GENAP502|Apply mathematical analysis, statistics and probability|60`),DM=P(`GENDM502|Apply dynamics and mechanical waves|40`);
const NIT4={C:COMP4,G:P(`GENFA402|Apply fundamental mathematical analysis|60
GENMP402|Apply mechanics and properties of matter|40
GENTD401|Apply Basics of Technical Drawing|50
GENDD401|Develop Database|70`),S:P(`NITWN401|Set up Wide Area Network|100
NITID401|Develop IoT System|140
NITIW401|Develop IoT web application using PHP|100
NITWA401|Administer Windows Server|100
NITWO401|Set up wireless network outdoor|80
NITFO401|Deploy Fiber Optics Network|80
NITIA401|Integrate the workplace|200`)};
const CSA4={C:COMP4,G:P(`GENFA402|Apply fundamental mathematical analysis|60
GENMP402|Apply mechanics and properties of matter|40
GENSW401|Apply SolidWorks Design|60
GENFC401|Apply C++ programming|70
GENCP401|Apply C Programming|80
GENDE401|Apply digital electronics|80`),S:P(`CSACR401|Refurbish Computer system|70
CSAES401|Develop embedded System Hardware|120
CSAFD401|Develop embedded system firmware|80
CSALS401|Set up LED and LCD screen|70
CSACE401|Create Electronics Enclosure|70
CSAIA401|Integrate the workplace|200`)};
const SWD4={C:COMP4,G:P(`GENFA402|Apply fundamental mathematical analysis|60
GENMP402|Apply mechanics and properties of matter|40
GENBN401|Perform Basic of Networking|70`),S:P(`SWDDA401|Apply Data Structure and Algorithm fundamentals using JavaScript|130
SWDBS401|Design Backend System|80
SWDBA401|Develop a Backend Application using Node.js|100
SWDDD401|Develop Database|100
SWDPP401|Apply PHP Programming|150
SWDWS401|Perform Basic Windows Server Administration|90
SWDIA401|Integrate the workplace|200`)};
const SWD3={C:COMP3,G:P(`GENGD301|Apply basic graphics design|80
GENAT302|Apply Algebra and Trigonometry|60
GENGP302|Apply General Physics|40`),S:P(`SWDPR301|Analyse Project Requirements|50
SWDWD301|Develop Website|110
SWDVC301|Conduct Version Control|70
SWDUX301|Design UI/UX|100
SWDJF301|Apply JavaScript|100
SWDVF301|Develop game in Vue|120
ICTIA301|Integrate the Workplace|200`)};
const NIT3={C:COMP3,G:P(`GENCP302|Apply C Programming Fundamentals|80
GENNT301|Apply Network Fundamentals|80
GENEF302|Apply Electronic fundamentals|80
GENBE302|Apply Basics of Electricity|70
GENAT302|Apply Algebra and Trigonometry|60
GENGP302|Apply General Physics|40`),S:P(`NITLI301|Setup LAN|60
NITCI301|Install CCTV System|70
NITWI301|Set up Wireless Network indoor|50
NITVI301|Setup VoIP System|70
NITIS301|Install IoT System|70
NITIA301|Integrate the Workplace|200`)};
const CSA3={C:COMP3,G:P(`GENNF301|Apply Network Fundamentals|50
GENBE302|Apply Fundamentals of Electricity|70
GENEF302|Apply Electronic fundamentals|60
GENTD301|Apply basic of technical drawing|50
GENAC302|Demonstrate Basics Of Chemistry|30
GENAT302|Apply Algebra and Trigonometry|60
GENGP302|Apply General Physics|40`),S:P(`CSAIA301|Assemble PCB and Computer system|80
CSATM301|Maintain Telephone|50
CSACM301|Maintain computer system|60
CSACI301|Implement electronic circuit|70
CSACD301|Deploy computer system|50
CSAPD301|Deploy Computer Peripherals|60
CSAPA301|Integrate the workplace|200`)};
const SWD5={C:COMP5,G:[...AP,...DM,...P(`GENPP501|Apply Python Programming|80
GENQA501|Apply Quality Assurance|30`)],S:P(`SWDFA501|Develop FrontEnd Using ReactJS|110
SWDMA501|Develop Mobile Application using Flutter|100
SWDBF501|Apply fundamentals of Blockchain|100
SWDML501|Apply fundamental machine learning|100
SWDDO501|Apply DevOps Techniques|70
SWDND501|Develop NoSQL Database|70
NITIA501|Integrate the Workplace|200`)};
const NIT5={C:COMP5,G:[...AP,...DM,...P(`GENPP501|Apply Python Programming Fundamentals|100`)],S:P(`NITLS501|Administer Linux Server|100
NITZC501|Apply Zero Client using Ncomputing Technology|100
NITCS501|Apply Cyber Security|120
NITCC501|Apply cloud computing Technology in Datacenter|120
NITML501|Apply Machine Learning fundamentals|120
NITIA501|Integrate the Workplace|200`)};
const CSA5={C:COMP5,G:[...AP,...DM],S:P(`GENDS501|Apply Data Structure and Algorithm using C programming|100
GENWS501|Apply Windows Server Administration|60
GENCC501|Consume Cloud Computing Services|60
CSAPS501|Develop Computer Power System|100
CSACH501|Design Computer Hardware Architecture|100
CSASA501|Automate System using PLC|90
CSAHK501|Develop Hobby Kernel Development|120
GENQA501|Apply Quality Assurance|30
CSAIA501|Integrate the Workplace|200`)};
const FAD3={C:COMP3,G:P(`GENBE302|Apply Basics of Domestic Electricity|30
GENAC302|Demonstrate Basics of Chemistry|30
GENAT302|Apply Basic Algebra and Trigonometry|60
GENCE303|Apply cost estimation|30
GENTD301|Perform technical drawing|50
GENMS301|Perform Basic Maintenance of sewing machines|40`),S:P(`FADHP301|Draft Hand Pattern|80
FADHS301|Perform hand sketching|50
FADSA301|Perform Basic stitches and surface application|80
FADGC301|Perform Garment Construction|110
FADHS301|Perform Hand Weaving|70
FADCK301|Perform Crocheting and knitting|50
FADFC301|Perform Fabric Care|50
FADIA302|Integrate the Workplace|200`)};
const FAD4={C:[...COMP4,{code:"CCMKK402",title:"Kutumia Kiswahili katika mawasiliano ya kawaida",h:30}],G:P(`GENFA402|Apply Elementary Mathematical Analysis|60
GENAC402|Demonstrate Knowledge of Organic Chemistry|30
GENST401|Perform sewing techniques|60
FADSP401|Sell Fashion Products and Services|40`),S:P(`FADFC401|Perform Fabric cutting|50
FADFFM401|Perform fabric manipulation|70
FADPM401|Manipulate block pattern|110
FADDM401|Make formal dress|120
FADMJ401|Make Jumpsuit|70
FADME401|Perform machine embroidery|70
FADWJ401|Make women jacket|110
FADIA402|Integrate the workplace|200`)};
const FAD5={C:COMP5,G:[...AP.map(x=>x),...P(`FADDI501|Perform Digital Illustration|90
FADDP501|Make Digital Pattern|100`)],S:P(`FADEG501|Make Evening Gown|100
FADMS501|Make Men suit|120
FADMW501|Make Men’s Wear|90
FADWW501|Make Women’s wear|110
FADFA501|Make Fashion Accessories|90
FADIA502|Integrate the Workplace|200`)};
const ACCB=["English for Accounting","Management in Accounting","ICT in Accounting","Financial Accounting","Mathematics for Accounting","Taxation","Entrepreneurship","Ikinyarwanda","General Studies","Physical Education and Sport","French (combination, non-literary)"];
const mk=a=>({A:a.map((n,i)=>({code:String(i+1).padStart(2,"0"),title:n}))});
const DEPTS=[
{n:"ICT and Multimedia",t:[
 {n:"Software Development",c:[["L3 Software Development",SWD3],["L4 Software Development A",SWD4],["L4 Software Development B",SWD4],["L5 Software Development",SWD5]]},
 {n:"Networking and Internet Technologies",c:[["L3 Networking and Internet Technologies",NIT3],["L4 Networking and Internet Technologies A",NIT4],["L4 Networking and Internet Technologies B",NIT4],["L5 Networking and Internet Technologies",NIT5]]},
 {n:"Computer System and Architecture",c:[["L3 Computer System and Architecture",CSA3],["L4 Computer System and Architecture",CSA4],["L5 Computer System and Architecture",CSA5]]}]},
{n:"Fashion and Design",t:[{n:"Fashion Design",c:[["L3 Fashion Design",FAD3],["L4 Fashion Design",FAD4],["L5 Fashion Design",FAD5]]}]},
{n:"Professional Accountant",t:[{n:"Accounting",c:[["Senior 4 Accounting",mk(ACCB)],["Senior 5 Accounting",mk(ACCB)],["Senior 6 Accounting",mk(["Auditing",...ACCB])]]}]}];
const GR=[["C","Complementary Modules","--c1"],["G","General Modules","--c2"],["S","Specific (Core) Modules","--c3"],["A","All Subjects","--c1"]];
let sel="L3 Software Development",q="";
const all={};DEPTS.forEach(d=>d.t.forEach(t=>t.c.forEach(([n,x])=>all[n]=x)));

export const GROUP_LABELS = {
  C: { label: "Complementary Modules", colorVar: "--c1" },
  G: { label: "General Modules", colorVar: "--c2" },
  S: { label: "Specific (Core) Modules", colorVar: "--c3" },
  A: { label: "All Subjects", colorVar: "--c1" },
};

export const GROUP_ORDER = ["C", "G", "S", "A"];

export function getClassList() {
  const list = [];
  DEPTS.forEach((d) =>
    d.t.forEach((t) =>
      t.c.forEach(([name]) => list.push({ name, department: d.n, trade: t.n }))
    )
  );
  return list;
}

export function getModulesForClass(className) {
  return all[className] || null;
}

export { DEPTS, GR, all, P };
