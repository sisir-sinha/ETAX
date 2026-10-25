/* ============================================================
   ETAX SPA — Vanilla JS router + view renderer
   Recreates the Consultax functionalities without jQuery:
   Revolution Slider -> Swiper · Slick -> Swiper · Isotope ->
   vanilla filter · CountTo -> IntersectionObserver counters
   ============================================================ */
"use strict";
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const bdt = n => "৳" + Math.round(n).toLocaleString("en-US");
let swipers = [];

function toast(msg, ok = true) {
  const t = $("#toast");
  t.innerHTML = `<i class="fa-solid ${ok ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${esc(msg)}`;
  t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3600);
}
function saveLead(kind, data) {
  try {
    const k = "etax_" + kind, arr = JSON.parse(localStorage.getItem(k) || "[]");
    arr.push({ ...data, at: new Date().toISOString() });
    localStorage.setItem(k, JSON.stringify(arr));
  } catch (e) { /* storage unavailable — form still "works" for the visitor */ }
}
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v || "");
const isPhone = v => /^[+()\-.\s\d]{10,17}$/.test((v || "").trim());
function mark(el, bad) { el.classList.toggle("err", !!bad); return !bad; }

/* ---------------- Reusable components ---------------- */
const head = (eyebrow, title, text = "", center = false) => `
  <div class="section-head ${center ? "center" : ""}" data-aos="fade-up">
    <span class="eyebrow">${esc(eyebrow)}</span><h2>${title}</h2>${text ? `<p>${esc(text)}</p>` : ""}
  </div>`;

const pageHeader = (title, crumb, img) => `
  <section class="page-header">
    <img class="bg" src="${img || IMG + "bg-pheader.jpg"}" alt="" />
    <div class="container" data-aos="fade-up">
      <h1>${esc(title)}</h1>
      <nav class="breadcrumb"><a href="./">Home</a><i class="fa-solid fa-angle-right"></i><span class="cur">${esc(crumb)}</span></nav>
    </div>
  </section>`;

const serviceCard = (s, i) => `
  <article class="service-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 90}">
    <div class="service-media"><img src="${s.img}" alt="${esc(s.title)}" loading="lazy" /><span class="service-icon"><i class="${s.icon}"></i></span></div>
    <div class="service-body">
      <h4><a href="service/${s.slug}">${esc(s.title)}</a></h4><p>${esc(s.short)}</p>
      <div class="service-foot">
        <span class="service-price"><small>STARTING FROM</small>${esc(s.price)}</span>
        <a class="link-arrow" href="service/${s.slug}">Read More <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </div>
  </article>`;

const projectCard = (p, i) => `
  <article class="project-card" data-cat="${esc(p.cat)}" data-aos="fade-up" data-aos-delay="${(i % 3) * 90}" data-goto="project/${p.slug}" role="link" tabindex="0">
    <img src="${p.img}" alt="${esc(p.title)}" loading="lazy" />
    <div class="project-overlay"><span class="cat">${esc(p.cat)} · ${esc(p.place)}</span><h4>${esc(p.title)}</h4><p>${esc(p.excerpt)}</p></div>
  </article>`;

const postCard = (p, i) => `
  <article class="blog-card" data-cat="${esc(p.cat)}" data-title="${esc((p.title + " " + p.excerpt).toLowerCase())}" data-aos="fade-up" data-aos-delay="${(i % 3) * 90}">
    <div class="blog-media"><a href="post/${p.slug}"><img src="${p.img}" alt="${esc(p.title)}" loading="lazy" /></a><span class="blog-date"><i class="fa-regular fa-calendar"></i> ${esc(p.date)}</span></div>
    <div class="blog-body">
      <div class="blog-meta"><span><i class="fa-solid fa-folder-open"></i> ${esc(p.cat)}</span><span><i class="fa-solid fa-user-pen"></i> ${esc(p.author.split(",")[0])}</span><span><i class="fa-regular fa-clock"></i> ${esc(p.read)}</span></div>
      <h4><a href="post/${p.slug}">${esc(p.title)}</a></h4><p>${esc(p.excerpt)}</p>
      <a class="link-arrow" href="post/${p.slug}">Continue Reading <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  </article>`;

const teamCard = (m, i) => `
  <article class="team-card" data-team="${i}" data-aos="fade-up" data-aos-delay="${(i % 4) * 80}" tabindex="0" role="button" aria-label="About ${esc(m.name)}">
    <div class="t-media"><img src="${m.img}" alt="${esc(m.name)}" loading="lazy" />
      <div class="team-socials"><a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a><a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a><a href="mailto:${ETAX.email}" aria-label="Email"><i class="fa-solid fa-envelope"></i></a></div>
    </div>
    <div class="team-body"><h4>${esc(m.name)}</h4><span>${esc(m.role).toUpperCase()}</span></div>
  </article>`;

const statsBand = () => `
  <section class="section stats-band" style="padding:64px 0">
    <div class="container"><div class="stats-grid">
      ${ETAX.stats.map(s => `<div class="stat" data-aos="zoom-in"><i class="${s.icon}"></i><div class="num" data-count="${s.value}" data-suffix="${s.suffix}">0</div><p>${esc(s.label)}</p></div>`).join("")}
    </div></div>
  </section>`;

const testimonialsSection = (title = "What Our Clients Say?") => `
  <section class="section">
    <div class="container">
      ${head("Testimonials", title, "Real words from factory owners, founders, doctors and NGOs who trust ETAX with their compliance.", true)}
      <div class="swiper testi-swiper"><div class="swiper-wrapper">
        ${ETAX.testimonials.map(t => `<div class="swiper-slide"><div class="testi-card">
          <img class="stars" src="${IMG}stars.png" alt="5 star rating" /><i class="fa-solid fa-quote-left quote"></i>
          <p>${esc(t.text)}</p>
          <div class="testi-person"><img src="${t.img}" alt="${esc(t.name)}" /><div><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></div></div>
        </div></div>`).join("")}
      </div><div class="swiper-pagination"></div></div>
    </div>
  </section>`;

const partnersSection = () => `
  <section class="section" style="padding:52px 0 64px">
    <div class="container">
      <p style="text-align:center" class="eyebrow">Trusted by growing companies in Bangladesh</p>
      <div class="swiper partners-swiper" style="margin-top:2rem"><div class="swiper-wrapper">
        ${ETAX.partners.map(p => `<div class="swiper-slide"><img src="${p}" alt="Client logo" loading="lazy" /></div>`).join("")}
      </div></div>
    </div>
  </section>`;

const callbackSection = () => `
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="callback" data-aos="fade-up">
        <div>
          <span class="eyebrow" style="color:#ffb38f">Request a Free Call Back</span>
          <h2>How Can We Help?</h2>
          <p>Assessment notice, VAT audit, new company or just a question about your return — leave your number and a senior consultant (not a call centre) will ring you back.</p>
          <ul class="callback-contacts">
            <li><span class="cic"><i class="fa-solid fa-phone-volume"></i></span><div><strong>Hotline</strong><span>${ETAX.phone} (Sat–Thu, 9am–6pm)</span></div></li>
            <li><span class="cic"><i class="fa-solid fa-envelope-open-text"></i></span><div><strong>Email us</strong><span>${ETAX.email}</span></div></li>
            <li><span class="cic"><i class="fa-solid fa-location-dot"></i></span><div><strong>Head office</strong><span>${ETAX.address}</span></div></li>
          </ul>
        </div>
        <form class="form-card" id="callbackForm" novalidate>
          <h3><i class="fa-solid fa-headset" style="color:var(--orange)"></i> Request a Call Back</h3>
          <div class="form-row">
            <div class="form-group"><label>Name *</label><input name="name" type="text" placeholder="Your full name" /></div>
            <div class="form-group"><label>Phone *</label><input name="phone" type="tel" placeholder="01XXX-XXXXXX" /></div>
          </div>
          <div class="form-group"><label>Topic</label><select name="topic">${ETAX.services.map(s => `<option>${esc(s.title)}</option>`).join("")}<option>Something else</option></select></div>
          <div class="form-group"><label>Message</label><textarea name="message" rows="3" placeholder="Briefly, what do you need?"></textarea></div>
          <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Send Request</button>
          <p class="form-note" data-note role="status"></p>
        </form>
      </div>
    </div>
  </section>`;

const faqBlock = items => items.map(([q, a]) => `
  <div class="faq-item"><button class="faq-q" aria-expanded="false">${esc(q)}<i class="fa-solid fa-plus"></i></button><div class="faq-a"><p>${esc(a)}</p></div></div>`).join("");

const calcSection = () => `
  <section class="section section-ice">
    <div class="container">
      ${head("Free Tool", "Personal Income Tax Calculator", "Estimate your annual income tax in seconds. Slab-based estimator for individual taxpayers — for guidance only.")}
      <div class="calc">
        <form class="form-card" id="calcForm" data-aos="fade-right">
          <div class="form-group"><label>Annual taxable income (BDT) *</label><input id="calcIncome" type="number" min="0" step="1000" placeholder="e.g. 1200000" /></div>
          <div class="form-group"><label>Taxpayer category</label>
            <select id="calcCat">
              <option value="350000">General (tax-free up to ৳3,50,000)</option>
              <option value="400000">Woman / Senior citizen 65+ (up to ৳4,00,000)</option>
              <option value="475000">Third gender / Person with disability (up to ৳4,75,000)</option>
              <option value="500000">Gazetted freedom fighter (up to ৳5,00,000)</option>
            </select></div>
          <div class="form-group"><label>Eligible investment for rebate (BDT, optional)</label><input id="calcInvest" type="number" min="0" step="1000" placeholder="e.g. 150000" /></div>
          <button class="btn btn-navy btn-block" type="submit"><i class="fa-solid fa-calculator"></i> Calculate My Tax</button>
          <p class="form-note" data-note role="status"></p>
        </form>
        <div class="calc-output" id="calcOut" data-aos="fade-left">
          <h4><i class="fa-solid fa-file-invoice-dollar" style="color:var(--orange)"></i> Your Estimate</h4>
          <div class="calc-total" id="calcTotal">৳0</div>
          <div class="calc-rows" id="calcRows"><div class="cr"><span>Enter your income and press calculate…</span></div></div>
          <p class="calc-note">Illustrative slabs: 5% / 10% / 15% / 20% / 25% above the tax-free threshold; investment rebate shown at 15% of eligible investment, capped as per rules. Rates change with each Finance Act and minimum tax may apply — book a free consultation for an exact computation.</p>
        </div>
      </div>
    </div>
  </section>`;

/* ---------------- Pages ---------------- */
function pageHome() {
  return `
  <section class="hero">
    <div class="swiper hero-swiper"><div class="swiper-wrapper">
      ${ETAX.heroSlides.map(s => `
        <div class="swiper-slide hero-slide">
          <div class="hero-bg"><img src="${s.img}" alt="" /></div>
          <div class="hero-content">
            <div class="hero-copy">
              <span class="eyebrow">${esc(s.eyebrow)}</span>
              <h1>${esc(s.title).replace(/Business|Success/g, m => `<span>${m}</span>`)}</h1>
              <p>${esc(s.text)}</p>
              <div class="hero-cta">
                <button class="btn btn-primary" data-open-quote>Get Quote <i class="fa-solid fa-arrow-right"></i></button>
                <a class="btn btn-outline" href="services">Our Services</a>
              </div>
            </div>
            <div class="hero-person"><img src="${s.person}" alt="ETAX consultant" /></div>
          </div>
        </div>`).join("")}
    </div><div class="swiper-pagination"></div></div>
    <div class="hero-nav"><button class="hero-prev" aria-label="Previous slide"><i class="fa-solid fa-arrow-left"></i></button><button class="hero-next" aria-label="Next slide"><i class="fa-solid fa-arrow-right"></i></button></div>
  </section>

  <section class="features"><div class="container"><div class="features-grid">
    ${ETAX.features.map((f, i) => `<div class="feature-card" data-aos="fade-up" data-aos-delay="${i * 90}"><span class="fic"><i class="${f.icon}"></i></span><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></div>`).join("")}
  </div></div></section>

  <section class="section"><div class="container"><div class="two-col">
    <div class="about-media" data-aos="fade-right">
      <img class="main-img" src="${IMG}about1.jpg" alt="ETAX consultants at work" />
      <img class="second-img" src="${IMG}about2.jpg" alt="Client meeting" />
      <div class="exp-badge"><strong>25+</strong><span>YEARS OF<br/>EXPERIENCE</span></div>
      <button class="play-btn" data-open-video aria-label="Watch: how to file e-Return"><i class="fa-solid fa-play"></i></button>
    </div>
    <div data-aos="fade-left">
      <span class="eyebrow">What do we do?</span>
      <h2 style="font-size:clamp(1.7rem,3vw,2.4rem);margin:.6rem 0 .9rem">Our Mission, Values<br/>and Motto</h2>
      <p><strong style="color:var(--navy)">“File right. Pay right. Sleep well.”</strong> Since 2001, ETAX has stood between Bangladeshi businesses and the anxiety of tax, VAT and audit season. Our chartered accountants and income-tax practitioners translate NBR circulars into plain decisions — so a notice from the tax office becomes a routine letter, not a crisis.</p>
      <ul class="check-list">
        <li><i class="fa-solid fa-circle-check"></i> Every return reviewed by a senior before filing</li>
        <li><i class="fa-solid fa-circle-check"></i> Fixed-fee retainers — no surprise bills</li>
        <li><i class="fa-solid fa-circle-check"></i> One compliance calendar for TIN, VAT, RJSC & licences</li>
        <li><i class="fa-solid fa-circle-check"></i> Bangla-first explanations, English reporting for HQ</li>
      </ul>
      <div class="ceo-row">
        <a class="btn btn-primary" href="about">About Us <i class="fa-solid fa-arrow-right"></i></a>
        <img src="${IMG}sign-dark.png" alt="Managing Partner signature" />
        <div class="ceo-meta"><strong>Md. Rahimul Islam, FCA</strong><span>Managing Partner, ETAX</span></div>
      </div>
    </div>
  </div></div></section>

  <section class="section section-ice"><div class="container">
    ${head("Our Services", "What We Bring To You", "Six practices, one promise: your compliance handled end-to-end by named professionals.", true)}
    <div class="grid-3">${ETAX.services.map(serviceCard).join("")}</div>
  </div></section>

  ${statsBand()}

  <section class="section"><div class="container">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:1rem;flex-wrap:wrap">
      ${head("Case Studies", "We Are The Leaders", "A few recent engagements — filter by practice area.")}
      <a class="btn btn-navy" href="projects" style="margin-bottom:48px">All Case Studies</a>
    </div>
    <div class="filter-bar" data-filter-group="projects">
      ${["All", "Tax", "VAT", "Audit", "Advisory"].map((c, i) => `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`).join("")}
    </div>
    <div class="grid-3" id="projectGrid">${ETAX.projects.map(projectCard).join("")}</div>
  </div></section>

  <section class="section section-ice"><div class="container">
    ${head("How It Works", "How We Work With Clients", "", true)}
    <div class="grid-3">
      ${ETAX.steps.map((s, i) => `<article class="step-card" data-aos="fade-up" data-aos-delay="${i * 100}"><img src="${s.img}" alt="${esc(s.title)}" loading="lazy" /><div class="step-body"><span class="step-no">${s.no}</span><h4>${esc(s.title)}</h4><p>${esc(s.text)}</p></div></article>`).join("")}
    </div>
  </div></section>

  ${calcSection()}
  ${testimonialsSection()}
  ${callbackSection()}

  <section class="section" style="padding-top:0"><div class="container">
    ${head("Latest News", "Our Latest News", "NBR updates and practical guides, written by the consultants who file for you.", true)}
    <div class="grid-3">${ETAX.posts.slice(0, 3).map(postCard).join("")}</div>
    <div style="text-align:center;margin-top:2.2rem"><a class="btn btn-navy" href="blog">View All Articles <i class="fa-solid fa-arrow-right"></i></a></div>
  </div></section>
  ${partnersSection()}`;
}

function pageAbout() {
  return `
  ${pageHeader("About Us", "About Us", IMG + "bg-about.jpg")}
  <section class="section"><div class="container"><div class="two-col">
    <div data-aos="fade-right">
      <span class="eyebrow">We are ETAX</span>
      <h2 style="font-size:clamp(1.7rem,3vw,2.4rem);margin:.6rem 0 .9rem">A Dhaka Firm, Built For Bangladeshi Business</h2>
      <p>ETAX began in 2001 as a two-person tax practice in Motijheel. Twenty-five years later we are a 32-member team of chartered accountants, income-tax practitioners, VAT consultants and company-law specialists serving more than 1,250 clients — from single-outlet restaurants to export-oriented RMG groups and foreign-funded startups.</p>
      <p style="margin-top:.8rem">Our difference is boring, and that is the point: documented processes, senior review on every filing, and a compliance calendar that has not missed a statutory deadline since 2016.</p>
      <ul class="check-list">
        <li><i class="fa-solid fa-circle-check"></i> Partner firms registered with ICAB; ITPs enrolled with NBR</li>
        <li><i class="fa-solid fa-circle-check"></i> Panel auditors accepted by all major scheduled banks</li>
        <li><i class="fa-solid fa-circle-check"></i> Associate network in Chattogram, Khulna, Rajshahi & Sylhet</li>
      </ul>
      <a class="btn btn-primary" href="team">Meet Our Team</a>
    </div>
    <div class="about-media" data-aos="fade-left">
      <img class="main-img" src="${IMG}about3.jpg" alt="ETAX office" />
      <img class="second-img" src="${IMG}whyus.jpg" alt="Why choose ETAX" />
      <div class="exp-badge"><strong>2001</strong><span>ESTABLISHED<br/>IN Motijheel</span></div>
    </div>
  </div></div></section>

  <section class="section section-ice"><div class="container">
    ${head("Our Mission, Values and Motto", "What Drives Every Filing", "", true)}
    <div class="grid-3">
      ${[["fa-solid fa-bullseye", "Our Mission", "To make tax, VAT and corporate compliance so predictable that Bangladeshi entrepreneurs never lose sleep — or a bank loan — over paperwork."],
         ["fa-solid fa-gem", "Our Values", "Accuracy before speed. Candour before comfort. And a simple rule: we never file anything we would not defend in a hearing ourselves."],
         ["fa-solid fa-flag", "Our Motto", "“File right. Pay right. Sleep well.” Three short sentences printed above every desk in our DOHS Baridhara office."]]
        .map(([ic, t, x], i) => `<div class="feature-card" data-aos="fade-up" data-aos-delay="${i * 90}"><span class="fic"><i class="${ic}"></i></span><h4>${t}</h4><p>${x}</p></div>`).join("")}
    </div>
  </div></section>

  <section class="section"><div class="container">
    ${head("Partner achievements & statistics", "Our 25 Years Of Operation", "", true)}
  </div></section>
  ${statsBand()}

  <section class="section"><div class="container">
    <div style="display:flex;justify-content:space-between;align-items:end;gap:1rem;flex-wrap:wrap">
      ${head("Leadership", "Our Team Of Leading Experts", "Click any member to read their profile.")}
      <a class="btn btn-navy" href="team" style="margin-bottom:48px">Full Team</a>
    </div>
    <div class="grid-4">${ETAX.team.slice(0, 4).map(teamCard).join("")}</div>
  </div></section>
  ${callbackSection()}`;
}

function pageServices() {
  return `
  ${pageHeader("Our Services", "Services", IMG + "banner.jpg")}
  <section class="section"><div class="container">
    ${head("What we bring to you", "Tax, VAT & Advisory Services", "Transparent starting prices, fixed-fee quotes after one free consultation.", true)}
    <div class="grid-3">${ETAX.services.map(serviceCard).join("")}</div>
  </div></section>
  <section class="section section-ice"><div class="container"><div class="two-col">
    <div data-aos="fade-right">
      <span class="eyebrow">Common questions</span>
      <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);margin:.6rem 0 1.2rem">Before You Appoint Us</h2>
      ${faqBlock([
        ["Do you charge for the first consultation?", "No. The first meeting — at our Dhaka office, by phone or on Zoom — is always free, and you receive a written fixed-fee quote afterwards."],
        ["Can everything be done remotely?", "Yes. Most clients send documents by email or WhatsApp; originals are only needed for certain RJSC and bank matters, which we collect by courier."],
        ["What happens if NBR sends a notice later?", "If the notice relates to a return we filed, representation at the first hearing is included in your fee. Appeals are quoted separately and transparently."],
        ["Do you work with very small businesses?", "Absolutely — around 60% of our retainer clients have fewer than 15 employees. Retainers start at ৳5,000 per month."],
      ])}
    </div>
    <div data-aos="fade-left"><img src="${IMG}service8.jpg" alt="Consultation" style="border-radius:var(--radius);box-shadow:var(--shadow);aspect-ratio:4/3.4;object-fit:cover;width:100%" /></div>
  </div></div></section>
  ${callbackSection()}`;
}

function pageServiceDetail(slug) {
  const s = ETAX.services.find(x => x.slug === slug) || ETAX.services[0];
  const others = ETAX.services.filter(x => x.slug !== s.slug).slice(0, 3);
  return `
  ${pageHeader(s.title, "Service Detail", IMG + "banner.jpg")}
  <section class="section"><div class="container"><div class="detail-grid">
    <aside class="sidebar">
      <div class="side-card"><h4>All Services</h4><div class="side-links">
        ${ETAX.services.map(x => `<a href="service/${x.slug}" class="${x.slug === s.slug ? "active" : ""}">${esc(x.title)}<i class="fa-solid fa-angle-right"></i></a>`).join("")}
      </div></div>
      <div class="help-box">
        <h4>How Can We Help?</h4><p>Talk to a ${esc(s.title.split(" ")[0].toLowerCase())} specialist today — the first consultation is free.</p>
        <div class="hotline"><i class="fa-solid fa-phone-volume"></i><div><small>Hotline</small><strong>${ETAX.phone}</strong></div></div>
        <button class="btn btn-primary btn-block" style="margin-top:1rem" data-open-quote data-service="${esc(s.title)}">Get This Service</button>
      </div>
      <div class="side-card"><h4>At a Glance</h4><table class="meta-table">
        <tr><td>Starting fee</td><td>${esc(s.price)}</td></tr>
        <tr><td>Turnaround</td><td>Quoted per engagement</td></tr>
        <tr><td>Coverage</td><td>All over Bangladesh</td></tr>
      </table></div>
    </aside>
    <div class="detail-main">
      <img class="hero-img" src="${s.img}" alt="${esc(s.title)}" />
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.short)} Our approach is deliberately process-driven: a documented checklist, preparation by a dedicated executive, review by a senior consultant, and filing with proof delivered to your inbox the same day.</p>
      <h2 style="font-size:1.35rem">Our Specific Work</h2>
      <ul class="check-list" style="grid-template-columns:1fr 1fr;display:grid">
        ${s.deliverables.map(d => `<li><i class="fa-solid fa-circle-check"></i> ${esc(d)}</li>`).join("")}
      </ul>
      <div class="two-col" style="gap:2rem;margin-top:1.6rem;align-items:start">
        <div><h3 style="margin-bottom:1.1rem;font-size:1.2rem">How We Perform</h3>
          ${s.bars.map(([l, v]) => `<div class="bar-row"><div class="bar-head"><span>${esc(l)}</span><span>${v}%</span></div><div class="bar-track"><div class="bar-fill" data-bar="${v}"></div></div></div>`).join("")}
        </div>
        <img src="${IMG}chart-service.png" alt="Service performance chart" style="width:100%;border-radius:12px" />
      </div>
      <h2 style="font-size:1.35rem">Frequently Asked Questions</h2>
      ${faqBlock(s.faq)}
    </div>
  </div></div></section>
  <section class="section section-ice"><div class="container">
    ${head("Keep exploring", "Related Services", "", true)}
    <div class="grid-3">${others.map(serviceCard).join("")}</div>
  </div></section>`;
}

function pageProjects() {
  return `
  ${pageHeader("Case Studies", "Case Studies", IMG + "bg-home2.jpg")}
  <section class="section"><div class="container">
    ${head("We are the leaders", "Recent Engagements", "Filter by practice area. Client names are generalised for confidentiality — references available on request.", true)}
    <div class="filter-bar" data-filter-group="projects" style="justify-content:center">
      ${["All", "Tax", "VAT", "Audit", "Advisory"].map((c, i) => `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`).join("")}
    </div>
    <div class="grid-3" id="projectGrid">${ETAX.projects.map(projectCard).join("")}</div>
    <div class="cta-band" data-aos="fade-up">
      <div><h3>Your case could be next</h3><p>Free first consultation. Fixed-fee quote in writing.</p></div>
      <button class="btn" data-open-quote>Start a Conversation <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  </div></section>`;
}

function pageProjectDetail(slug) {
  const idx = Math.max(0, ETAX.projects.findIndex(x => x.slug === slug));
  const p = ETAX.projects[idx], prev = ETAX.projects[(idx + ETAX.projects.length - 1) % ETAX.projects.length], next = ETAX.projects[(idx + 1) % ETAX.projects.length];
  const t = ETAX.testimonials[idx % ETAX.testimonials.length];
  return `
  ${pageHeader(p.title, "Case Study Detail", IMG + "bg-home2.jpg")}
  <section class="section"><div class="container"><div class="detail-grid">
    <aside class="sidebar">
      <div class="side-card"><h4>Project Information</h4><table class="meta-table">
        <tr><td>Client</td><td>${esc(p.client)}</td></tr>
        <tr><td>Sector</td><td>${esc(p.sector)}</td></tr>
        <tr><td>Practice</td><td>${esc(p.cat)}</td></tr>
        <tr><td>Completed</td><td>${esc(p.date)}</td></tr>
        <tr><td>Location</td><td>${esc(p.place)}, Bangladesh</td></tr>
      </table></div>
      <div class="help-box"><h4>Facing a similar issue?</h4><p>Our ${esc(p.cat)} team can review your position free of charge.</p>
        <div class="hotline"><i class="fa-solid fa-phone-volume"></i><div><small>Hotline</small><strong>${ETAX.phone}</strong></div></div>
        <button class="btn btn-primary btn-block" style="margin-top:1rem" data-open-quote>Book Free Review</button></div>
    </aside>
    <div class="detail-main">
      <div class="swiper gallery-swiper"><div class="swiper-wrapper">
        ${p.gallery.map(g => `<div class="swiper-slide"><img src="${g}" alt="${esc(p.title)}" /></div>`).join("")}
      </div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div><div class="swiper-pagination"></div></div>
      <h2>${esc(p.title)}</h2>
      <div class="result-grid">${p.result.map(([l, v]) => `<div class="result-box"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join("")}</div>
      <h2 style="font-size:1.35rem">Description Of The Project</h2>
      <p>${esc(p.excerpt)} The engagement began with a two-week diagnostic: we reviewed three years of filings, registers and correspondence, then presented the client with a written action plan separating quick wins from structural fixes.</p>
      <p>Execution followed our standard discipline — a named engagement manager, weekly status notes in plain language, and every submission logged against a compliance calendar. Where government hearings were required, our consultants appeared with complete paper books, which materially shortened proceedings.</p>
      <p>The client now runs on a monthly retainer with ETAX, and the systems put in place during this project — registers, checklists and review steps — continue to produce clean filings quarter after quarter.</p>
      <h2 style="font-size:1.35rem">What Our Client Says?</h2>
      <div class="testi-card"><img class="stars" src="${IMG}stars.png" alt="5 stars" /><p>“${esc(t.text)}”</p>
        <div class="testi-person"><img src="${t.img}" alt="${esc(t.name)}" /><div><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></div></div></div>
      <div class="prev-next">
        <a class="pn-card" href="project/${prev.slug}"><small><i class="fa-solid fa-arrow-left"></i> Previous case</small><strong>${esc(prev.title)}</strong></a>
        <a class="pn-card right" href="project/${next.slug}"><small>Next case <i class="fa-solid fa-arrow-right"></i></small><strong>${esc(next.title)}</strong></a>
      </div>
    </div>
  </div></div></section>`;
}

function pageBlog() {
  const cats = ["All", ...new Set(ETAX.posts.map(p => p.cat))];
  return `
  ${pageHeader("Latest News", "News & Insights", IMG + "blog-post.jpg")}
  <section class="section"><div class="container">
    ${head("Our Blog", "Guides, Deadlines & NBR Updates", "Search articles or filter by topic — written by practising consultants, not content writers.", true)}
    <div class="blog-tools">
      <div class="blog-search"><i class="fa-solid fa-magnifying-glass"></i><input id="blogSearch" type="text" placeholder="Search articles… (e.g. VAT, RJSC, freelancer)" /></div>
    </div>
    <div class="filter-bar" data-filter-group="blog">
      ${cats.map((c, i) => `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
    <div class="grid-3" id="blogGrid">${ETAX.posts.map(postCard).join("")}</div>
    <div class="empty-state" id="blogEmpty" style="display:none"><i class="fa-solid fa-newspaper"></i><h3 style="margin:.7rem 0 .3rem">No articles found</h3><p>Try a different keyword or category.</p></div>
  </div></section>
  ${callbackSection()}`;
}

function pagePost(slug) {
  const p = ETAX.posts.find(x => x.slug === slug) || ETAX.posts[0];
  const related = ETAX.posts.filter(x => x.slug !== p.slug && x.cat === p.cat).concat(ETAX.posts.filter(x => x.slug !== p.slug && x.cat !== p.cat)).slice(0, 3);
  const initials = p.author.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return `
  ${pageHeader("News Detail", p.cat, IMG + "blog-post.jpg")}
  <section class="section"><div class="container"><div class="detail-grid">
    <aside class="sidebar">
      <div class="side-card"><h4>Categories</h4><div class="side-links">
        ${[...new Set(ETAX.posts.map(x => x.cat))].map(c => `<a href="blog" class="${c === p.cat ? "active" : ""}">${esc(c)}<i class="fa-solid fa-angle-right"></i></a>`).join("")}
      </div></div>
      <div class="side-card"><h4>Recent Posts</h4><div class="side-links">
        ${ETAX.posts.slice(0, 4).map(x => `<a href="post/${x.slug}">${esc(x.title)}<i class="fa-solid fa-angle-right"></i></a>`).join("")}
      </div></div>
      <div class="help-box"><h4>Need help with this topic?</h4><p>Our consultants handle exactly this — every week.</p>
        <button class="btn btn-primary btn-block" style="margin-top:1rem" data-open-quote>Ask a Consultant</button></div>
    </aside>
    <article class="detail-main">
      <img class="hero-img" src="${p.img}" alt="${esc(p.title)}" />
      <div class="post-meta"><span><i class="fa-regular fa-calendar"></i> ${esc(p.date)}</span><span><i class="fa-solid fa-user-pen"></i> ${esc(p.author)}</span><span><i class="fa-solid fa-folder-open"></i> ${esc(p.cat)}</span><span><i class="fa-regular fa-clock"></i> ${esc(p.read)}</span></div>
      <h2 style="margin-top:.2rem">${esc(p.title)}</h2>
      ${p.body.map(par => `<p>${esc(par)}</p>`).join("")}
      <div class="author-box"><span class="av">${esc(initials)}</span><div><strong>${esc(p.author)}</strong><p style="font-size:.92rem">Practising consultant at ETAX, Dhaka. Writes the guides our own clients receive after every Finance Act.</p></div></div>
      <h2 style="font-size:1.35rem">Leave A Comment</h2>
      <div id="commentList"></div>
      <form class="form-card" id="commentForm" data-slug="${p.slug}" style="margin-top:1.4rem;border:1px solid var(--line)" novalidate>
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input name="name" type="text" placeholder="Your name" /></div>
          <div class="form-group"><label>Email *</label><input name="email" type="email" placeholder="you@example.com" /></div>
        </div>
        <div class="form-group"><label>Comment *</label><textarea name="text" rows="4" placeholder="Share your experience or ask a question…"></textarea></div>
        <button class="btn btn-primary" type="submit"><i class="fa-solid fa-comment"></i> Post Comment</button>
        <p class="form-note" data-note role="status"></p>
      </form>
    </article>
  </div></div></section>
  <section class="section section-ice"><div class="container">
    ${head("Keep reading", "Related Articles", "", true)}
    <div class="grid-3">${related.map(postCard).join("")}</div>
  </div></section>`;
}

function pageTeam() {
  return `
  ${pageHeader("Our Team", "Team", IMG + "bg-team.jpg")}
  <section class="section"><div class="container">
    ${head("Leadership", "We Are A Great Family", "Chartered accountants, income-tax practitioners and VAT specialists — click a profile to know more.", true)}
    <div class="grid-4">${ETAX.team.map(teamCard).join("")}</div>
    <div class="cta-band" data-aos="fade-up">
      <div><h3>You want to join us?</h3><p>Articleship students and experienced tax executives — a dream job awaits you at ETAX.</p></div>
      <a class="btn" href="contact">Apply via Contact Page <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  </div></section>
  ${testimonialsSection("What Our Clients Say")}
  ${partnersSection()}`;
}

function pageContact() {
  const offices = [
    ["fa-solid fa-building", "Dhaka — Head Office", "House 12, Road 5, DOHS Baridhara, Dhaka 1212", ETAX.phone, ETAX.email],
    ["fa-solid fa-anchor", "Chattogram Office", "Finlay House (3rd Floor), Agrabad C/A, Chattogram 4100", "+880 1819-654321", "ctg@etax.com.bd"],
    ["fa-solid fa-mountain-city", "Sylhet Office", "Jatarpur Point, Sylhet 3100", "+880 1912-345678", "sylhet@etax.com.bd"],
  ];
  return `
  ${pageHeader("Contact Us", "Contact Us", IMG + "bg-contact.jpg")}
  <section class="section"><div class="container">
    <div class="grid-3" style="margin-bottom:3rem">
      ${offices.map(([ic, t, a, ph, em], i) => `<div class="office-card" data-aos="fade-up" data-aos-delay="${i * 90}"><span class="cic"><i class="${ic}"></i></span><h4>${t}</h4><ul>
        <li><i class="fa-solid fa-location-dot li"></i> ${a}</li><li><i class="fa-solid fa-phone li"></i> ${ph}</li><li><i class="fa-solid fa-envelope li"></i> ${em}</li>
        <li><i class="fa-regular fa-clock li"></i> Sat–Thu: 9.00 am – 6.00 pm</li></ul></div>`).join("")}
    </div>
    <div class="two-col" style="align-items:stretch">
      <form class="form-card" id="contactForm" data-aos="fade-right" style="border:1px solid var(--line)" novalidate>
        <h3>Contact Form</h3>
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input name="name" type="text" placeholder="Your full name" /></div>
          <div class="form-group"><label>Phone *</label><input name="phone" type="tel" placeholder="01XXX-XXXXXX" /></div>
        </div>
        <div class="form-group"><label>Email *</label><input name="email" type="email" placeholder="you@company.com.bd" /></div>
        <div class="form-group"><label>Subject</label><select name="subject">${ETAX.services.map(s => `<option>${esc(s.title)}</option>`).join("")}<option>Careers / Articleship</option><option>Other</option></select></div>
        <div class="form-group"><label>Message *</label><textarea name="message" rows="5" placeholder="How can we help?"></textarea></div>
        <button class="btn btn-primary btn-block" type="submit"><i class="fa-solid fa-paper-plane"></i> Send Message</button>
        <p class="form-note" data-note role="status"></p>
      </form>
      <div class="map-wrap" data-aos="fade-left">
        <img src="${IMG}maps.jpg" alt="Map — ETAX head office, DOHS Baridhara, Dhaka" />
        <div class="map-pin"><i class="fa-solid fa-location-dot"></i> ETAX — DOHS Baridhara, Dhaka</div>
      </div>
    </div>
  </div></section>
  <section class="section section-ice"><div class="container">
    ${head("Quick answers", "Frequently Asked Questions", "", true)}
    <div style="max-width:860px;margin:auto">${faqBlock([
      ["Where exactly is the head office?", "House 12, Road 5, DOHS Baridhara, Dhaka 1212 — five minutes from Baridhara. Parking available; please bring your NID for the DOHS gate."],
      ["Can I walk in without an appointment?", "You can, but a booked slot guarantees the right specialist is available. Call +880 1711-123456 or use the form above."],
      ["Do you serve clients outside Dhaka?", "Yes — through our Chattogram and Sylhet offices and associate firms in Khulna and Rajshahi. Most monthly compliance is handled remotely anywhere in Bangladesh."],
    ])}</div>
  </div></section>`;
}

function page404() {
  return `<section class="section"><div class="container notfound">
    <div class="big">404</div><h2 style="margin:.6rem 0">Page Not Found</h2>
    <p>The page you requested has moved — much like a well-planned tax position.</p>
    <a class="btn btn-primary" style="margin-top:1.4rem" href="./"><i class="fa-solid fa-house"></i> Back To Home</a>
  </div></section>`;
}

/* ---------------- Router (History API — clean URLs, no #) ---------------- */
const BASE = window.__ETAX_BASE__ || "/";
const titles = { home: "ETAX — Tax, VAT & Financial Consulting in Bangladesh", about: "About Us — ETAX", services: "Our Services — ETAX", projects: "Case Studies — ETAX", blog: "News & Insights — ETAX", team: "Our Team — ETAX", contact: "Contact Us — ETAX" };

/* Current in-app path ("" = home), with the deploy base stripped:
   "/ETAX/service/vat" -> "service/vat", "/about" -> "about" */
function appPath() {
  let p = location.pathname;
  if (BASE !== "/" && p.indexOf(BASE) === 0) p = p.slice(BASE.length);
  else if (BASE !== "/" && p === BASE.replace(/\/$/, "")) p = "";
  else p = p.replace(/^\//, "");
  return p.replace(/(^|\/)index\.html$/, "").replace(/\/$/, "");
}
/* Navigate without reload. Accepts "about", "/about", "./" (home) or a full
   pathname already including the base (from a resolved anchor href). */
function navigate(to) {
  let path;
  if (to === "./" || to === "" || to === "/") path = BASE;
  else if (to.indexOf(BASE) === 0) path = to;
  else path = BASE + to.replace(/^\.\//, "").replace(/^\//, "");
  if (path !== location.pathname) history.pushState(null, "", path);
  route();
}
function route() {
  const parts = appPath().split("/").filter(Boolean);
  let html, nav = "home", title = titles.home;
  if (!parts.length) { html = pageHome(); }
  else if (parts[0] === "about") { html = pageAbout(); nav = "about"; title = titles.about; }
  else if (parts[0] === "services") { html = pageServices(); nav = "services"; title = titles.services; }
  else if (parts[0] === "service" && parts[1]) { const s = ETAX.services.find(x => x.slug === parts[1]); html = s ? pageServiceDetail(s.slug) : page404(); nav = "services"; title = s ? s.title + " — ETAX" : "Not Found — ETAX"; }
  else if (parts[0] === "projects") { html = pageProjects(); nav = "projects"; title = titles.projects; }
  else if (parts[0] === "project" && parts[1]) { const p = ETAX.projects.find(x => x.slug === parts[1]); html = p ? pageProjectDetail(p.slug) : page404(); nav = "projects"; title = p ? p.title + " — ETAX" : "Not Found — ETAX"; }
  else if (parts[0] === "blog") { html = pageBlog(); nav = "blog"; title = titles.blog; }
  else if (parts[0] === "post" && parts[1]) { const p = ETAX.posts.find(x => x.slug === parts[1]); html = p ? pagePost(p.slug) : page404(); nav = "blog"; title = p ? p.title + " — ETAX" : "Not Found — ETAX"; }
  else if (parts[0] === "team") { html = pageTeam(); nav = "team"; title = titles.team; }
  else if (parts[0] === "contact") { html = pageContact(); nav = "contact"; title = titles.contact; }
  else { html = page404(); title = "Not Found — ETAX"; }

  swipers.forEach(s => { try { s.destroy(true, true); } catch (e) {} }); swipers = [];
  $("#app").innerHTML = html;
  document.title = title;
  $$("#mainNav a").forEach(a => a.classList.toggle("active", a.dataset.nav === nav));
  closeDrawer(); closeSearch();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  afterRender(parts);
}

/* ---------------- Post-render initialisers ---------------- */
function afterRender(parts) {
  // Swiper (hero, testimonials, partners, gallery)
  if (typeof Swiper !== "undefined") {
    if ($(".hero-swiper")) swipers.push(new Swiper(".hero-swiper", { loop: true, speed: 850, effect: "fade", fadeEffect: { crossFade: true }, autoplay: { delay: 6000, disableOnInteraction: false }, pagination: { el: ".hero-swiper .swiper-pagination", clickable: true }, navigation: { nextEl: ".hero-next", prevEl: ".hero-prev" } }));
    if ($(".testi-swiper")) swipers.push(new Swiper(".testi-swiper", { slidesPerView: 1, spaceBetween: 24, loop: true, autoplay: { delay: 5200, disableOnInteraction: false }, pagination: { el: ".testi-swiper .swiper-pagination", clickable: true }, breakpoints: { 720: { slidesPerView: 2 }, 1080: { slidesPerView: 3 } } }));
    if ($(".partners-swiper")) swipers.push(new Swiper(".partners-swiper", { slidesPerView: 2, spaceBetween: 30, loop: true, speed: 700, autoplay: { delay: 2200, disableOnInteraction: false }, breakpoints: { 640: { slidesPerView: 3 }, 1000: { slidesPerView: 5 } } }));
    if ($(".gallery-swiper")) swipers.push(new Swiper(".gallery-swiper", { loop: true, speed: 600, autoplay: { delay: 4500 }, pagination: { el: ".gallery-swiper .swiper-pagination", clickable: true }, navigation: { nextEl: ".gallery-swiper .swiper-button-next", prevEl: ".gallery-swiper .swiper-button-prev" } }));
  }
  // AOS
  if (typeof AOS !== "undefined") { AOS.refreshHard ? AOS.refreshHard() : AOS.refresh(); }
  // Counters
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1700;
    const tick = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US") + (k === 1 ? suf : ""); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .45 });
  $$("[data-count]").forEach(el => io.observe(el));
  // Skill bars
  const bo = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.style.width = en.target.dataset.bar + "%"; bo.unobserve(en.target); } }), { threshold: .5 });
  $$("[data-bar]").forEach(el => bo.observe(el));
  // Post comments
  if (parts[0] === "post") renderComments(parts[1]);
}

/* ---------------- Comments (localStorage) ---------------- */
function getComments(slug) {
  try {
    const raw = localStorage.getItem("etax_comments_" + slug);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { name: "Sharif Uddin", date: "2 days ago", text: "Very practical. Filed my return following this checklist and got the acknowledgement the same day." },
    { name: "Ms. Ferdousi Rahman", date: "5 days ago", text: "Please write a follow-up for small traders. Our association members ask these questions every week." },
  ];
}
function renderComments(slug) {
  const box = $("#commentList"); if (!box) return;
  const list = getComments(slug);
  box.innerHTML = `<p style="font-family:var(--head);font-weight:700;color:var(--navy-ink)">${list.length} Comment${list.length === 1 ? "" : "s"}</p>` +
    list.map(c => `<div class="comment"><span class="av">${esc(c.name.trim()[0] || "E")}</span><div><strong>${esc(c.name)}</strong><time>${esc(c.date)}</time><p style="font-size:.93rem">${esc(c.text)}</p></div></div>`).join("");
}

/* ---------------- Tax calculator ---------------- */
function calcTax(income, free, invest) {
  const slabs = [[100000, .05, "Next ৳1,00,000 @ 5%"], [300000, .10, "Next ৳3,00,000 @ 10%"], [400000, .15, "Next ৳4,00,000 @ 15%"], [500000, .20, "Next ৳5,00,000 @ 20%"], [Infinity, .25, "Balance @ 25%"]];
  let rest = Math.max(0, income - free), tax = 0; const rows = [[`First ${bdt(free)} @ 0%`, "৳0"]];
  for (const [limit, rate, label] of slabs) {
    if (rest <= 0) break;
    const amt = Math.min(rest, limit), t = amt * rate; tax += t; rest -= amt;
    rows.push([`${label} (on ${bdt(amt)})`, bdt(t)]);
  }
  const rebateCap = Math.min(invest * .15, income * .03, 1000000);
  const rebate = Math.min(rebateCap, tax);
  if (rebate > 0) rows.push(["Less: investment rebate (est.)", "− " + bdt(rebate)]);
  let payable = tax - rebate;
  if (income > free && payable > 0 && payable < 5000) { rows.push(["Minimum tax applied (Dhaka area)", bdt(5000)]); payable = 5000; }
  return { payable, rows, eff: income ? (payable / income * 100) : 0 };
}

/* ---------------- Global interactions ---------------- */
// Fill nav/footer/drawer from data
(function buildChrome() {
  const link = s => `<li><a href="service/${s.slug}"><i class="${s.icon}"></i> ${esc(s.title)}</a></li>`;
  $("#serviceDropdown").innerHTML = ETAX.services.map(link).join("");
  $("#drawerServices").innerHTML = `<li><a href="services">All Services</a></li>` + ETAX.services.map(s => `<li><a href="service/${s.slug}">${esc(s.title)}</a></li>`).join("");
  $("#footerServices").innerHTML = ETAX.services.map(s => `<li><a href="service/${s.slug}">${esc(s.title)}</a></li>`).join("");
  $("#qService").innerHTML = `<option value="">Select a service…</option>` + ETAX.services.map(s => `<option>${esc(s.title)}</option>`).join("") + `<option>Not sure — advise me</option>`;
  $("#year").textContent = new Date().getFullYear();
})();

// Sticky header + back-to-top
const mainbar = $("#mainbar"), btt = $("#backToTop");
addEventListener("scroll", () => {
  const y = scrollY;
  mainbar.classList.toggle("stuck", y > 150);
  document.body.style.paddingTop = y > 150 ? mainbar.offsetHeight + "px" : "";
  btt.classList.toggle("show", y > 500);
}, { passive: true });
btt.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

// Mobile drawer
const drawer = $("#mobileDrawer"), backdrop = $("#drawerBackdrop");
function closeDrawer() { drawer.classList.remove("open"); backdrop.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); $("#menuToggle").setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
$("#menuToggle").addEventListener("click", () => { drawer.classList.add("open"); backdrop.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); $("#menuToggle").setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; });
$("#drawerClose").addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);
$(".drawer-acc-btn").addEventListener("click", e => { const li = e.currentTarget.parentElement; li.classList.toggle("expanded"); e.currentTarget.setAttribute("aria-expanded", li.classList.contains("expanded")); });

// Search overlay
const overlay = $("#searchOverlay"), sInput = $("#searchInput"), sResults = $("#searchResults");
const searchable = [
  ...ETAX.services.map(s => ({ type: "Service", icon: s.icon, title: s.title, sub: s.short, href: "service/" + s.slug })),
  ...ETAX.projects.map(p => ({ type: "Case Study", icon: "fa-solid fa-briefcase", title: p.title, sub: p.excerpt, href: "project/" + p.slug })),
  ...ETAX.posts.map(p => ({ type: "Article", icon: "fa-regular fa-newspaper", title: p.title, sub: p.excerpt, href: "post/" + p.slug })),
  { type: "Page", icon: "fa-solid fa-users", title: "Our Team", sub: "Meet the consultants behind ETAX", href: "team" },
  { type: "Page", icon: "fa-solid fa-calculator", title: "Income Tax Calculator", sub: "Estimate your personal tax on the home page tool", href: "./" },
  { type: "Page", icon: "fa-solid fa-phone", title: "Contact Us", sub: ETAX.address, href: "contact" },
];
function runSearch(q) {
  q = (q || "").trim().toLowerCase();
  if (!q) { sResults.innerHTML = searchable.slice(0, 5).map(hit).join(""); return; }
  const hits = searchable.filter(x => (x.title + " " + x.sub + " " + x.type).toLowerCase().includes(q)).slice(0, 8);
  sResults.innerHTML = hits.length ? hits.map(hit).join("") : `<div class="search-empty"><i class="fa-solid fa-face-frown"></i> Nothing matched “${esc(q)}”. Try “VAT”, “return” or “RJSC”.</div>`;
}
const hit = x => `<a class="search-hit" href="${x.href}"><i class="${x.icon}"></i><span><small>${esc(x.type)}</small>${esc(x.title)}</span></a>`;
function closeSearch() { overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
$("#searchToggle").addEventListener("click", () => { overlay.classList.add("open"); overlay.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; runSearch(""); setTimeout(() => sInput.focus(), 120); });
$("#searchClose").addEventListener("click", closeSearch);
sInput.addEventListener("input", e => runSearch(e.target.value));
addEventListener("keydown", e => { if (e.key === "Escape") { closeSearch(); closeDrawer(); $$(".modal.open").forEach(closeModal); } });

// Modals
function openModal(id) { const m = $(id); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
function closeModal(m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (m.id === "videoModal") $("#videoFrame").innerHTML = ""; }
document.addEventListener("click", e => {
  const dead = e.target.closest('a[href="#"]');
  if (dead) { e.preventDefault(); return; } // placeholder social links must not trigger router navigation
  const q = e.target.closest("[data-open-quote]");
  if (q) { closeDrawer(); if (q.dataset.service) $("#qService").value = q.dataset.service; openModal("#quoteModal"); return; }
  if (e.target.closest("[data-open-video]")) {
    $("#videoFrame").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/KbxSN5CC-Vk?rel=0" title="How to submit income tax e-Return online in Bangladesh" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    openModal("#videoModal"); return;
  }
  const closer = e.target.closest("[data-close-modal]");
  if (closer) { closeModal(closer.closest(".modal")); return; }
  const tc = e.target.closest("[data-team]");
  if (tc && !e.target.closest("a")) { openTeam(+tc.dataset.team); return; }
  const go = e.target.closest("[data-goto]");
  if (go) { navigate(go.dataset.goto); return; }
  const fq = e.target.closest(".faq-q");
  if (fq) { const it = fq.parentElement, was = it.classList.contains("open"); $$(".faq-item.open").forEach(x => { x.classList.remove("open"); x.querySelector(".faq-q").setAttribute("aria-expanded", "false"); }); if (!was) { it.classList.add("open"); fq.setAttribute("aria-expanded", "true"); } return; }
  const fb = e.target.closest(".filter-btn");
  if (fb) { applyFilter(fb); }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const tc = e.target.closest && e.target.closest("[data-team]"); if (tc) openTeam(+tc.dataset.team);
  const go = e.target.closest && e.target.closest("[data-goto]"); if (go) navigate(go.dataset.goto);
});
function openTeam(i) {
  const m = ETAX.team[i]; if (!m) return;
  $("#teamModalCard").innerHTML = `
    <button class="modal-close" data-close-modal aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    <div class="team-modal-head"><img src="${m.img}" alt="${esc(m.name)}" /><div><span>${esc(m.role).toUpperCase()}</span><h3 style="margin:.2rem 0">${esc(m.name)}</h3><p style="font-size:.88rem"><i class="fa-solid fa-envelope" style="color:var(--orange)"></i> via ${ETAX.email}</p></div></div>
    <p>${esc(m.bio)}</p>
    <button class="btn btn-primary" style="margin-top:1.3rem" data-open-quote>Request a Consultation</button>`;
  openModal("#teamModal");
}

// Filters (Isotope replacement)
let blogCat = "All", blogQuery = "";
function applyFilter(btn) {
  const group = btn.closest("[data-filter-group]").dataset.filterGroup, val = btn.dataset.filter;
  $$(".filter-btn", btn.parentElement).forEach(b => b.classList.toggle("active", b === btn));
  if (group === "projects") {
    $$("#projectGrid .project-card").forEach(c => c.classList.toggle("hide", val !== "All" && c.dataset.cat !== val));
  } else if (group === "blog") { blogCat = val; filterBlog(); }
  if (typeof AOS !== "undefined") AOS.refresh();
}
function filterBlog() {
  let visible = 0;
  $$("#blogGrid .blog-card").forEach(c => {
    const ok = (blogCat === "All" || c.dataset.cat === blogCat) && c.dataset.title.includes(blogQuery);
    c.style.display = ok ? "" : "none"; if (ok) visible++;
  });
  const em = $("#blogEmpty"); if (em) em.style.display = visible ? "none" : "block";
}
document.addEventListener("input", e => { if (e.target.id === "blogSearch") { blogQuery = e.target.value.trim().toLowerCase(); filterBlog(); } });

// Forms
document.addEventListener("submit", e => {
  const f = e.target, note = f.querySelector("[data-note]"); if (!f.id) return;
  const setNote = (msg, ok) => { if (note) { note.textContent = msg; note.className = "form-note " + (ok ? "ok" : "bad"); } };
  if (f.id === "newsletterForm") {
    e.preventDefault(); const em = $("#newsletterEmail");
    if (!isEmail(em.value)) { toast("Please enter a valid email to subscribe.", false); em.focus(); return; }
    saveLead("subscribers", { email: em.value }); toast("Subscribed! Tax deadlines will now find you before NBR does."); f.reset(); return;
  }
  if (f.id === "quoteForm") {
    e.preventDefault();
    const name = $("#qName"), phone = $("#qPhone"), email = $("#qEmail"), svc = $("#qService");
    let ok = mark(name, !name.value.trim()) & mark(phone, !isPhone(phone.value)) & mark(svc, !svc.value) & mark(email, email.value && !isEmail(email.value));
    if (!ok) { $("#quoteNote").textContent = "Please complete the highlighted fields correctly."; $("#quoteNote").className = "form-note bad"; return; }
    saveLead("leads", { name: name.value, phone: phone.value, email: email.value, service: svc.value, message: $("#qMsg").value });
    $("#quoteNote").textContent = `Thank you, ${name.value.split(" ")[0]}! A consultant will call ${phone.value} within one working day.`; $("#quoteNote").className = "form-note ok";
    toast("Quote request received — we'll call you back shortly."); f.reset();
    setTimeout(() => closeModal($("#quoteModal")), 1600); return;
  }
  if (f.id === "callbackForm" || f.id === "contactForm") {
    e.preventDefault();
    const nm = f.elements.name, ph = f.elements.phone, em = f.elements.email, ms = f.elements.message;
    let ok = mark(nm, !nm.value.trim()) & mark(ph, !isPhone(ph.value)) & mark(ms, !ms.value.trim());
    if (em) ok = ok & mark(em, !isEmail(em.value));
    if (!ok) { setNote("Please complete the highlighted fields correctly.", false); return; }
    saveLead(f.id === "contactForm" ? "messages" : "leads", Object.fromEntries(new FormData(f)));
    setNote(`Thank you, ${nm.value.split(" ")[0]}! Your ${f.id === "contactForm" ? "message has been sent" : "call-back request is booked"} — we will contact ${ph.value} within one working day.`, true);
    toast("Request received. Talk soon!"); f.reset(); return;
  }
  if (f.id === "commentForm") {
    e.preventDefault();
    const nm = f.elements.name, em = f.elements.email, tx = f.elements.text;
    let ok = mark(nm, !nm.value.trim()) & mark(em, !isEmail(em.value)) & mark(tx, tx.value.trim().length < 3);
    if (!ok) { setNote("Please add your name, a valid email and a comment.", false); return; }
    const slug = f.dataset.slug, list = getComments(slug);
    list.push({ name: nm.value.trim(), date: "Just now", text: tx.value.trim() });
    try { localStorage.setItem("etax_comments_" + slug, JSON.stringify(list)); } catch (err) {}
    renderComments(slug); setNote("Comment posted. Thank you for joining the discussion!", true); toast("Comment posted."); f.reset(); return;
  }
  if (f.id === "calcForm") {
    e.preventDefault();
    const inc = $("#calcIncome"), val = parseFloat(inc.value);
    if (!mark(inc, !(val >= 0) || inc.value === "")) { setNote("Enter your annual taxable income to calculate.", false); return; }
    setNote("", true);
    const { payable, rows, eff } = calcTax(val, +$("#calcCat").value, parseFloat($("#calcInvest").value) || 0);
    $("#calcTotal").textContent = bdt(payable);
    $("#calcRows").innerHTML = rows.map(([l, v]) => `<div class="cr"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join("") +
      `<div class="cr" style="border:0"><span>Effective tax rate</span><strong>${eff.toFixed(2)}%</strong></div>`;
    $("#calcOut").scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

/* Internal links: plain left-clicks become SPA navigation (pushState).
   Modified clicks (Ctrl/Cmd/middle), external sites, mailto:/tel: and
   target/download links keep their normal browser behaviour — and thanks
   to the <base> tag + 404.html redirect they still land on the right page. */
document.addEventListener("click", e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download")) return;
  const raw = a.getAttribute("href");
  if (!raw || raw.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  navigate(url.pathname + url.search);
});

/* ---------------- Boot ---------------- */
addEventListener("popstate", route);
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") AOS.init({ duration: 750, once: true, offset: 60 });
  route();
  setTimeout(() => $("#preloader").classList.add("done"), 450);
});
addEventListener("load", () => $("#preloader").classList.add("done"));
