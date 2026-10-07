// Shared content for the public CISD website pages.
// Source: https://www.cisd.edu.pk/ and the CISD admission posters.

export const SITE = {
  name: "College of International Skills Development",
  short: "CISD",
  tagline: "Skills. Recognised qualifications. Real careers.",
  founded: 2016,
  email: "info@cisd.edu.pk",
  phone: "+92-317 1173879",
  phoneHref: "tel:+923171173879",
  address: "9-A Shershah Block, New Garden Town, Lahore",
  website: "www.cisd.edu.pk",
  instagram: "https://www.instagram.com/cisd_official",
  facebook: "https://www.facebook.com/",
};

export const STATS = [
  { value: "70+", label: "Campuses nationwide" },
  { value: "30+", label: "Cities, urban and rural" },
  { value: "50,000", label: "Learners trained" },
  { value: "4", label: "Government affiliations" },
];

export const AFFILIATIONS = ["NAVTTC", "PSDF", "TEVTA", "FBISE"];

export const PROGRAMS = [
  {
    slug: "inter-tech",
    title: "Inter Tech Degree Program",
    tag: "2 years · FBISE approved",
    image: "/site/inter-tech-graphic.jpg",
    summary:
      "A two-year Inter Tech degree approved by FBISE, with fully funded scholarships for deserving students.",
    points: ["Approved by FBISE", "Fully funded scholarships for deserving students", "Practical skills from day one"],
  },
  {
    slug: "graphic-design",
    title: "Graphic Designing & Media Production",
    tag: "Creative careers",
    image: "/site/graphic-media.jpg",
    summary:
      "Design for brands and digital media, produce video and animation, and build a portfolio you can show employers.",
    points: ["Photoshop, Illustrator, InDesign, After Effects", "Logo, social media and branding design", "Freelancing and career growth"],
  },
  {
    slug: "hospitality",
    title: "Hospitality & Tourism Management",
    tag: "Hotels, travel & events",
    image: "/site/hospitality.jpg",
    summary: "Train for hotel careers, travel and tourism, and events and service roles.",
    points: ["Hotel careers: work in hotels and resorts", "Travel and tourism: plan, manage and explore", "Events and service: create memorable experiences"],
  },
  {
    slug: "chef",
    title: "Professional Chef",
    tag: "Culinary excellence",
    image: "/site/chef.jpg",
    summary: "Learn professional cooking techniques for top hotels, restaurants and cruise lines.",
    points: ["Professional cooking techniques", "Work in top hotels, restaurants and cruise lines", "Build a rewarding career in the food industry"],
  },
  {
    slug: "early-childhood",
    title: "Early Childhood",
    tag: "Shape tomorrow",
    image: "/site/early-childhood.jpg",
    summary: "Learn child development and teaching skills with hands-on experience in modern learning environments.",
    points: ["Early learning expert training", "Practical, hands-on classroom experience", "Work in schools, daycares and learning centres"],
  },
  {
    slug: "fashion",
    title: "Fashion Designing",
    tag: "Creative excellence",
    image: "/site/fashion.jpg",
    summary: "Create styles that inspire: cutting, stitching and modern techniques for fashion houses or your own brand.",
    points: ["Design your future", "Learn cutting, stitching and modern techniques", "Work in fashion houses or start your own brand"],
  },
  {
    slug: "iot",
    title: "IoT & Data Coding",
    tag: "Smart solutions",
    image: "/site/iot.jpg",
    summary: "Build IoT-enabled systems and learn programming and data coding for the tech industry.",
    points: ["Design and develop IoT solutions", "Learn programming and data coding", "Work in tech industries or start your own projects"],
  },
  {
    slug: "hair-beauty",
    title: "Hair & Beauty Services",
    tag: "Makeup artistry",
    image: "/site/hair-beauty.jpg",
    summary: "Master professional makeup techniques and build a career in salons, studios and the fashion industry.",
    points: ["Master professional makeup techniques", "Work in salons, studios and fashion", "Build your own beauty business"],
  },
];

export const WHY_CISD = [
  {
    title: "Skill-first learning",
    text: "Every programme is built around hands-on competence. Theory appears only where it directly enables practice. Labs are the classroom.",
  },
  {
    title: "Recognised qualifications",
    text: "Government recognition through NAVTTC, PSDF, TEVTA and FBISE keeps your credentials portable, including for overseas employment.",
  },
  {
    title: "Industry-aligned curriculum",
    text: "Courses are co-designed with employers, with direct corporate placement pipelines for graduates.",
  },
  {
    title: "Open to everyone",
    text: "Priority admission for women, rural applicants and persons with disabilities, and scholarships for deserving students.",
  },
];

export const ADMISSION_STEPS = [
  { title: "Create your account", text: "Sign up on the CISD admission portal with your email and a password." },
  { title: "Verify your email", text: "Confirm your email with the code we send you to activate the account." },
  { title: "Complete your application", text: "Fill in your personal and academic details and upload your documents." },
  { title: "Pay the admission challan", text: "Download your challan and pay the admission fee at the listed bank or online." },
  { title: "Get your admission letter", text: "Once reviewed and approved, download your admission letter and join your campus." },
];

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Programs" },
  { to: "/admissions", label: "Admissions" },
  { to: "/campuses", label: "Campuses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];
