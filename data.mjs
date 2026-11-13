// ============================================================================
//  data.mjs: website content (single source of truth).
//  Edit, save, run `npm run build`.
//  Rule for this site: publish only facts the business has confirmed.
// ============================================================================
import fs from 'node:fs';

export const SITE = {
  domain: 'https://mm-enterprises-service.com',        // official domain (no trailing slash); every canonical, sitemap and OG URL uses it
  name: 'MM Enterprises',
  subtitle: 'Kitchen Appliance Services',
  tagline: 'Elevating Your Kitchen Experience.',
  supportingTagline: 'Premium Appliance Solutions. Professional Service. Exceptional Care.',
  description:
    'MM Enterprises is a Chennai kitchen appliance service company and an authorised Elica service partner. We install, repair and maintain kitchen chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers.',
  city: 'Chennai',
  region: 'Tamil Nadu',
  country: 'IN',
  proprietor: 'Manikandan',
  experienceYears: 14,                                 // confirmed by the owner
  phone: '98408 71541',                                // shown on the site
  phoneLocal: '9840871541',                            // tel: links
  whatsapp: '97506 56371',                             // shown on the site
  whatsappDigits: '919750656371',                      // wa.me links (international format, digits only)
  whatsappGreeting: 'Hello MM Enterprises, I would like help with my kitchen appliance.',
  email: 'mmenterprses2@gmail.com',                    // confirmed by the owner; spelling is intentional
  addressLines: ['1st floor, No: 16B,', '2nd Bungalow St,', 'Ambal Nagar,', 'Ekkatuthangal,', 'Chennai - 600032'], // shown on the site exactly as written
  googleMapsLink: 'https://www.google.com/maps/place/MM+ENTERPRISES/@13.0074533,80.2103125,17z/data=!3m1!4b1!4m6!3m5!1s0x3a5267bbf8d74cef:0xaa583950007650bf!8m2!3d13.0074481!4d80.2128874!16s%2Fg%2F11h07whg05',
  // Web3Forms access key: set WEB3FORMS_ACCESS_KEY in .env (see .env.example). Never commit a real key here.
  web3formsKey: (process.env.WEB3FORMS_ACCESS_KEY || '').trim(),
  themeColor: '#071D33',
  logoFile: 'new_logo.jpeg',                           // photos/new_logo.jpeg, used unedited
};

export const SERVICE_TYPES = ['Installation', 'Repair', 'Maintenance'];
export const ENQUIRY_TYPES = [...SERVICE_TYPES, 'Custom quote'];

// The six product categories. `slug` is the anchor id on /services and the gallery filter key.
// `image` is a file in photos/ (without extension); `stock: true` marks a representative Unsplash image.
export const PRODUCTS = [
  {
    slug: 'kitchen-chimneys', name: 'Kitchen Chimneys', single: 'kitchen chimney', icon: 'chimney', price: 499,
    image: 'kitchen-chimney-02', alt: 'Kitchen chimney with a curved glass hood and steel duct, serviced by MM Enterprises in Chennai', pos: '50% 40%',
    short: 'Installation, deep cleaning and suction repairs for wall and island chimneys.',
    intro: 'Daily Indian cooking leaves a lot of oil behind, and most of it ends up inside the chimney. We fit new chimneys at the right height with a sensible duct route, clean out the grease that slows the blower down, and track down the cause of weak suction, extra noise or faulty lights.',
    work: {
      Installation: ['Choosing the mounting height over your hob', 'Duct routing with as few bends as the wall allows', 'Wiring, fixing and a suction test before we leave'],
      Repair: ['Weak or uneven suction', 'Motor, blower and switch faults', 'Lights and touch panels that stop responding'],
      Maintenance: ['Baffle and mesh filter cleaning', 'Grease removal from the hood and oil cup', 'Blower and duct inspection'],
    },
  },
  {
    slug: 'built-in-hobs', name: 'Built-in Hobs', single: 'built-in hob', icon: 'hob', price: 349,
    image: 'built-in-hob-01', alt: 'Three burner glass built-in hob on a granite counter in a Chennai kitchen', pos: '50% 50%',
    short: 'Careful fitting, burner servicing and ignition repairs for glass and steel hobs.',
    intro: 'A built-in hob sits inside your counter and connects to gas and power, so the fitting has to be right the first time. We check the cut-out and clearances, connect and leak test the hob, and fix burners that light unevenly or ignition that keeps clicking.',
    work: {
      Installation: ['Counter cut-out and clearance checks', 'Gas and ignition connections', 'Leak test and flame check at handover'],
      Repair: ['Burners that will not light', 'Ignition that keeps clicking', 'Stiff, loose or broken knobs'],
      Maintenance: ['Burner cap and port cleaning', 'Safe cleaning for glass and steel tops', 'Flame and ignition check'],
    },
  },
  {
    slug: 'cooktops', name: 'Cooktops', single: 'cooktop', icon: 'cooktop', price: 249, stock: true,
    image: 'cooktop-01', alt: 'Electric cooktop on a white kitchen counter below a chimney', pos: '50% 60%',
    short: 'Gas, induction and electric cooktops set up properly and kept heating evenly.',
    intro: 'Gas, induction and electric cooktops each need a slightly different approach. We set your cooktop up on a stable surface with the right connection, find out why a zone or burner has stopped heating, and clean it in the way its surface needs.',
    work: {
      Installation: ['Placement on a stable, level surface', 'Gas or power connection to suit the unit', 'Every burner or zone tested'],
      Repair: ['Zones or burners that will not heat', 'Uneven heat and error codes', 'Noisy cooling fans on induction units'],
      Maintenance: ['Grate and burner cleaning on gas tops', 'Glass surface care for induction and electric', 'Vent and fan cleaning'],
    },
  },
  {
    slug: 'ovens', name: 'Ovens', single: 'oven', icon: 'oven', price: 449, stock: true,
    image: 'oven-01', alt: 'Pizzas baking on racks inside an open oven', pos: '50% 55%',
    short: 'Built-in and free-standing ovens that preheat on time and bake evenly.',
    intro: 'Slow preheating and food that browns on one side only are the complaints we hear most. We check the elements, thermostat, fan and door seal, clean the cavity, racks and glass, and fit built-in ovens into your cabinetry with the airflow they need.',
    work: {
      Installation: ['Cabinet fit and ventilation gaps for built-in ovens', 'Power connection matched to the oven', 'Heating and fan test'],
      Repair: ['Oven not heating, or heating slowly', 'Uneven baking and fan faults', 'Door, hinge and seal problems'],
      Maintenance: ['Cavity, rack and tray cleaning', 'Door glass and gasket care', 'Element and fan inspection'],
    },
  },
  {
    slug: 'microwave-ovens', name: 'Microwave Ovens', single: 'microwave oven', icon: 'microwave', price: 449, stock: true,
    image: 'microwave-oven-01', alt: 'White counter top microwave oven', pos: '50% 50%',
    short: 'Solo, grill and convection microwaves that heat properly and close securely.',
    intro: 'When a microwave runs but the food stays cold, it needs a proper check rather than a home fix. We look into heating faults, turntable and door problems, and keep the inside clean and the door closing firmly.',
    work: {
      Installation: ['Placement with clear ventilation space', 'Fitting built-in microwave models', 'Power and function check'],
      Repair: ['Runs but does not heat', 'Turntable and door faults', 'Sparking and control panel problems'],
      Maintenance: ['Interior and turntable cleaning', 'Door seal and latch care', 'Vent cleaning'],
    },
  },
  {
    slug: 'dishwashers', name: 'Dishwashers', single: 'dishwasher', icon: 'dishwasher', price: 449, stock: true,
    image: 'dishwasher-01', alt: 'Plates stacked in an open dishwasher rack', pos: '50% 40%',
    short: 'Drainage fixes, filter cleaning and new dishwasher installation.',
    intro: 'Water left at the bottom of the tub and dishes that come out greasy usually point to the filter, the drain or the spray arms. We clear drainage problems, clean the parts that matter, and connect new dishwashers to water and drain points.',
    work: {
      Installation: ['Water inlet and drain connections', 'Levelling in the cabinet or space', 'A full test cycle'],
      Repair: ['Water not draining', 'Not filling, heating or starting', 'Leaks and repeated error codes'],
      Maintenance: ['Filter and spray arm cleaning', 'Door seal and tub cleaning', 'Drain hose check'],
    },
  },
];

export const PRICE_NOTE = 'These are starting prices. The final charge depends on the appliance and the work it needs.';

export const SERVICES = [
  { name: 'Installation', icon: 'install', text: 'New appliances fitted safely and neatly, then tested before we hand them over to you.' },
  { name: 'Repair', icon: 'tools', text: 'We find the real cause of the fault and explain the fix before we start work.' },
  { name: 'Maintenance', icon: 'care', text: 'Regular cleaning and checks that keep your appliances running the way they should.' },
];

// Brand showcase. Logo files live in assets/brands/ (official artwork, used unaltered).
// Only Elica is an authorised relationship; the rest are brands we service.
export const BRANDS = [
  { name: 'Elica', logo: 'elica.svg', authorised: true },
  { name: 'Butterfly', logo: 'butterfly.png' },
  { name: 'Bosch', logo: 'bosch.svg' },
  { name: 'LG', logo: 'lg.svg' },
  { name: 'Siemens', logo: 'siemens.svg' },
  { name: 'Whirlpool', logo: 'whirlpool.svg' },
  // Drop the logo files into assets/brands/ with these exact names; until then the card shows the brand name.
  { name: 'Faber', logo: 'faber.png' },
  { name: 'Kaff', logo: 'kaff.png' },
  { name: 'Glen', logo: 'glen.png' },
];
export const BRANDS_NOTE = 'Authorised service partner for Elica. We also service Butterfly, Bosch, LG, Siemens, Whirlpool, Faber, Kaff and Glen appliances.';

export const WHY = [
  { title: 'Experienced technicians', icon: 'expert', text: `${14} years of hands-on work with kitchen appliances in Chennai homes.` },
  { title: 'Careful workmanship', icon: 'quality', text: 'Neat fitting, tidy duct work and a clean kitchen when the job is done.' },
  { title: 'Clear communication', icon: 'response', text: 'We explain what is wrong and what the work involves before we begin.' },
  { title: 'Support after the visit', icon: 'heart', text: 'Questions later? Call or WhatsApp us and we will help.' },
];

// Gallery. `cat` is a PRODUCTS slug, or 'installation' / 'maintenance'.
// Supplied photos (kitchen-chimney-*, built-in-hob-01/02) are MM Enterprises' own work; stock images are flagged.
export const GALLERY_CATS = ['kitchen-chimneys', 'built-in-hobs', 'cooktops', 'ovens', 'microwave-ovens', 'dishwashers', 'installation', 'maintenance'];
export const GALLERY_LABELS = { installation: 'Installation', maintenance: 'Maintenance' };
export const GALLERY = [
  // Kitchen chimneys (7, our own work)
  { image: 'kitchen-chimney-01', cat: 'kitchen-chimneys', title: 'Slim chimney with curved glass', alt: 'Black wall mounted kitchen chimney with a curved glass hood on a tiled wall' },
  { image: 'kitchen-chimney-05', cat: 'kitchen-chimneys', title: 'Chimney above a glass hob', alt: 'Kitchen chimney with steel duct fitted above a glass hob' },
  { image: 'kitchen-chimney-02', cat: 'kitchen-chimneys', title: 'Curved glass chimney', alt: 'Kitchen chimney with a curved glass hood and steel duct above a window' },
  { image: 'kitchen-chimney-10', cat: 'kitchen-chimneys', title: 'Chimney with touch controls', alt: 'Kitchen chimney with touch controls on a white tiled wall' },
  { image: 'kitchen-chimney-07', cat: 'kitchen-chimneys', title: 'Angled chimney over the cooking area', alt: 'Angled black kitchen chimney with a steel duct above a cooking counter' },
  { image: 'kitchen-chimney-04', cat: 'kitchen-chimneys', title: 'Chimney above a four burner hob', alt: 'Kitchen chimney with a curved glass hood above a four burner hob' },
  { image: 'kitchen-chimney-11', cat: 'kitchen-chimneys', title: 'Curved glass chimney, close view', alt: 'Close view of a black kitchen chimney with a curved glass hood' },
  // Built-in hobs (5)
  { image: 'built-in-hob-01', cat: 'built-in-hobs', title: 'Three burner glass hob', alt: 'Black glass three burner built-in hob on a granite counter' },
  { image: 'built-in-hob-02', cat: 'built-in-hobs', title: 'Built-in hob on granite', alt: 'Built-in glass hob with three brass burners set into a granite counter' },
  { image: 'built-in-hob-03', cat: 'built-in-hobs', title: 'Three burners lit', alt: 'Gas hob with three burners lit with blue flames', stock: true },
  { image: 'built-in-hob-04', cat: 'built-in-hobs', title: 'Burners and pan supports', alt: 'Gas hob burners with cast iron pan supports', stock: true },
  { image: 'built-in-hob-05', cat: 'built-in-hobs', title: 'Even blue flame', alt: 'Close view of a gas hob burner with an even blue flame', stock: true },
  // Cooktops (5)
  { image: 'cooktop-01', cat: 'cooktops', title: 'Electric cooktop', alt: 'Black electric cooktop on a white kitchen counter below a chimney', stock: true },
  { image: 'cooktop-02', cat: 'cooktops', title: 'Induction cooktop', alt: 'Black induction cooktop set into a white counter above a built-in oven', stock: true },
  { image: 'cooktop-03', cat: 'cooktops', title: 'Induction cooktop under pendants', alt: 'Black induction cooktop under two gold pendant lights', stock: true },
  { image: 'cooktop-04', cat: 'cooktops', title: 'Electric cooking range', alt: 'Electric cooking range with a steel pot on the cooktop', stock: true },
  { image: 'cooktop-05', cat: 'cooktops', title: 'Coil cooktop controls', alt: 'Electric coil cooktop with control knobs', stock: true },
  // Ovens (5)
  { image: 'oven-01', cat: 'ovens', title: 'Oven at work', alt: 'Pizzas baking on racks inside an open oven', stock: true },
  { image: 'oven-02', cat: 'ovens', title: 'Built-in wall ovens', alt: 'Black built-in wall ovens in a grey modern kitchen', stock: true },
  { image: 'oven-03', cat: 'ovens', title: 'Double oven', alt: 'Dark green double oven with brass handles', stock: true },
  { image: 'oven-04', cat: 'ovens', title: 'Built-in oven in cabinetry', alt: 'Built-in oven and microwave fitted into wooden kitchen cabinets', stock: true },
  { image: 'oven-05', cat: 'ovens', title: 'Range oven', alt: 'Stainless steel range oven below a tiled backsplash', stock: true },
  // Microwave ovens (4)
  { image: 'microwave-oven-01', cat: 'microwave-ovens', title: 'Counter top microwave', alt: 'White counter top microwave oven', stock: true },
  { image: 'microwave-oven-02', cat: 'microwave-ovens', title: 'Compact microwave', alt: 'Cream compact microwave oven on a wooden kitchen counter', stock: true },
  { image: 'microwave-oven-03', cat: 'microwave-ovens', title: 'Built-in microwave', alt: 'Stainless steel built-in microwave above wall ovens', stock: true },
  { image: 'microwave-oven-04', cat: 'microwave-ovens', title: 'Over the range microwave', alt: 'Stainless steel microwave mounted above a cooking range', stock: true },
  // Dishwashers (4)
  { image: 'dishwasher-01', cat: 'dishwashers', title: 'Dishwasher racks', alt: 'Plates stacked in an open dishwasher rack', stock: true },
  { image: 'dishwasher-02', cat: 'dishwashers', title: 'Loading the dishwasher', alt: 'Glasses and dishes being loaded into an open dishwasher', stock: true },
  { image: 'dishwasher-03', cat: 'dishwashers', title: 'Dishwasher in a home kitchen', alt: 'Dishwasher open in a home kitchen while dishes are loaded', stock: true },
  { image: 'dishwasher-04', cat: 'dishwashers', title: 'Cutlery basket', alt: 'Cutlery basket inside an open dishwasher', stock: true },
  // Installation (our chimney installations plus representative images)
  { image: 'kitchen-chimney-09', cat: 'installation', title: 'Island chimney being fitted', alt: 'Island kitchen chimney being installed in a kitchen under construction in Chennai' },
  { image: 'kitchen-chimney-12', cat: 'installation', title: 'Chimney installation', alt: 'Kitchen chimney installation on a tiled wall' },
  { image: 'kitchen-chimney-03', cat: 'installation', title: 'New chimney with steel duct', alt: 'Newly installed kitchen chimney with a steel duct' },
  { image: 'kitchen-chimney-08', cat: 'installation', title: 'Chimney fitted above a hob', alt: 'Kitchen chimney fitted above a two burner glass hob' },
  { image: 'appliance-installation-01', cat: 'installation', title: 'Fixing and fitting', alt: 'Power drill used for appliance installation', stock: true },
  // Maintenance and servicing
  { image: 'appliance-repair-technician-01', cat: 'maintenance', title: 'Servicing a component', alt: 'Technician servicing an appliance component', stock: true },
  { image: 'appliance-servicing-technician-01', cat: 'maintenance', title: 'Electrical checks', alt: 'Technician checking appliance wiring', stock: true },
  { image: 'appliance-service-tools-01', cat: 'maintenance', title: 'Service tools', alt: 'Appliance service tools laid out on a workbench', stock: true },
  { image: 'kitchen-cleaning-maintenance-01', cat: 'maintenance', title: 'Cleaning and care', alt: 'Kitchen surfaces being cleaned during routine maintenance', stock: true },
];

// Site reviews: the single source for the Home page review cards AND the /reviews page.
// Edit them here once and both pages update on the next build.
export const SAMPLE_REVIEWS = [
  { name: 'Arjun Kumar', rating: 5, product: 'Kitchen Chimney Service', text: 'My kitchen chimney was making a lot of noise and the suction had become very weak. The technician checked it properly, cleaned the filters and explained what was causing the issue. It is working much better now. Happy with the service.' },
  { name: 'Priya S', rating: 5, product: 'Built in Hob Repair', text: 'One of the burners on my hob was not lighting properly. I contacted them and got a proper response. The technician arrived, identified the problem and fixed it without unnecessary replacements. Good experience overall.' },
  { name: 'Karthik Raj', rating: 5, product: 'Oven Service', text: 'My oven was taking too long to heat up, and I was worried it might need to be replaced. They checked the heating issue and got it working again. The technician was patient and answered all my questions. Would recommend their service.' },
  { name: 'Divya R', rating: 5, product: 'Microwave Oven Repair', text: 'The microwave suddenly stopped heating even though the display was working. I booked a service and the technician found the issue after checking it. Everything was explained clearly before the repair. Glad I got it fixed instead of buying a new one.' },
  { name: 'Vignesh M', rating: 5, product: 'Dishwasher Service', text: 'Water was not draining properly from my dishwasher after every wash. The service person checked the drainage system and sorted out the problem. The visit was smooth, and the machine is running normally now.' },
  { name: 'Meena Lakshmi', rating: 5, product: 'Cooktop Repair', text: 'My cooktop had an issue with the flame, and cooking was becoming difficult. The technician checked each burner and fixed the problem. I liked that they explained the issue in simple words instead of rushing through the work.' },
  { name: 'Suresh Babu', rating: 5, product: 'Chimney Installation', text: 'Got a new kitchen chimney installed at home. The installation was neat, and they took care to check the alignment and suction before finishing. They also showed me how to maintain the filters. Satisfied with the work.' },
  { name: 'Nithya Prakash', rating: 5, product: 'Built in Hob Installation', text: 'Needed help installing a built in hob in our renovated kitchen. They handled the installation carefully and checked whether all the burners were working properly. The work was completed neatly. Thank you for the support.' },
  { name: 'Mohammed Asif', rating: 5, product: 'Microwave and Oven Service', text: 'I had problems with both my microwave and oven. I was able to get them checked during the service visit. The technician explained which issues needed attention and completed the repairs. It saved me the trouble of contacting two different service providers.' },
  { name: 'Anitha Devi', rating: 5, product: 'Chimney Maintenance', text: 'Had booked a chimney cleaning and maintenance service because grease had built up over time. The cleaning was done properly, and the technician also gave a few useful tips to keep it clean. Overall, a pleasant service experience.' },
];

// What the /reviews page shows. Turning a source off never affects the Home page.
//  siteReviews:  the SAMPLE_REVIEWS above (same data as the Home page). Set to false to remove them from /reviews,
//                for example once genuine Google reviews are connected.
//  adminReviews: reviews published through the /admin dashboard (Cloudflare D1), loaded live from /api/reviews.
export const REVIEWS_PAGE = { siteReviews: true, adminReviews: true };

// Service areas, converted from location_list.xlsx (original spellings kept).
export const AREAS = JSON.parse(fs.readFileSync(new URL('./data/service-areas.json', import.meta.url), 'utf8'));

// Stock image credits (Unsplash). Kept in the project for licensing records; not shown on the site.
export const CREDITS = JSON.parse(fs.readFileSync(new URL('./data/credits.json', import.meta.url), 'utf8'));

// Per-page titles and descriptions
export const PAGE_META = {
  home: { title: 'MM Enterprises | Kitchen Chimney & Appliance Service in Chennai', description: 'MM Enterprises Chennai: kitchen chimney, built-in hob, cooktop, oven, microwave and dishwasher installation, repair and maintenance. Authorised Elica service partner. Call 98408 71541.' },
  about: { title: 'About MM Enterprises | 14 Years of Kitchen Appliance Service in Chennai', description: 'MM Enterprises has 14 years of experience installing, repairing and maintaining kitchen chimneys, hobs, ovens and dishwashers across Chennai. Meet proprietor Manikandan.' },
  services: { title: 'Kitchen Chimney, Hob & Appliance Repair Services in Chennai | MM Enterprises', description: 'Kitchen chimney installation and repair, built-in hob service, cooktop, oven, microwave and dishwasher repair and maintenance in Chennai by MM Enterprises.' },
  pricing: { title: 'Appliance Service Charges in Chennai | MM Enterprises Pricing', description: 'Starting service charges for kitchen chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers in Chennai, plus custom quotes from MM Enterprises.' },
  areas: { title: 'Service Areas: Chennai, Kanchipuram & Thiruvallur | MM Enterprises', description: 'Find your pincode or locality. MM Enterprises provides kitchen chimney and appliance service across Chennai, Kanchipuram and Thiruvallur districts.' },
  gallery: { title: 'Kitchen Chimney & Appliance Installation Gallery | MM Enterprises Chennai', description: 'Photos of kitchen chimney and built-in hob installations by MM Enterprises in Chennai, with cooktops, ovens, microwaves and dishwashers we service.' },
  blog: { title: 'Kitchen Appliance Care Tips | MM Enterprises Chennai Blog', description: 'Practical maintenance guides for kitchen chimneys, built-in hobs, cooktops, ovens, microwave ovens and dishwashers from the MM Enterprises service team.' },
  reviews: { title: 'Customer Reviews | MM Enterprises Kitchen Appliance Service, Chennai', description: 'Read what customers say about MM Enterprises kitchen chimney, hob and appliance service in Chennai.' },
  contact: { title: 'Contact MM Enterprises | Book Kitchen Appliance Service in Chennai', description: 'Call 98408 71541, WhatsApp 97506 56371 or send a service request to MM Enterprises for kitchen chimney and appliance service in Chennai.' },
  privacy: { title: 'Privacy Policy | MM Enterprises', description: 'How MM Enterprises handles the details you send through the website enquiry form.' },
  terms: { title: 'Terms and Conditions | MM Enterprises', description: 'Terms for using the MM Enterprises website and making service enquiries.' },
  notFound: { title: 'Page not found | MM Enterprises', description: 'The page you were looking for could not be found.' },
  admin: { title: 'Reviews admin | MM Enterprises', description: 'Private review management.' },
};
