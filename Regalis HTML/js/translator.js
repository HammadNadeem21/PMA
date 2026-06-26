/**
 * PMA Language Translator Coordinator
 * Handles dynamic i18next loading, local storage persistence,
 * RTL/LTR stylesheet switching, dropdown updates, and content translation.
 */

(function () {
  'use strict';

  // Supported languages config
  const SUPPORTED_LANGS = ['en', 'ur', 'ar', 'ch', 'psh', 'sd'];
  const STORAGE_KEY = 'pma-lang';

  // Normalize profile keys from memberData for translation key generation.
  function normalizeProfileKey(key) {
    if (!key) return '';
    return key.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  // Build a fallback translation resource for profile modal content from the page's memberData.
  function buildProfileModalResources(profileData) {
    if (!profileData || typeof profileData !== 'object') return null;

    const modalResources = {};
    Object.entries(profileData).forEach(([memberKey, data]) => {
      const normalizedKey = normalizeProfileKey(memberKey);
      const rawKey = (memberKey || '').toString().trim().toLowerCase();
      if (!normalizedKey) return;

      const profileEntry = {
        name: data.name || '',
        role: data.role || '',
        highlight: data.highlight || '',
        about: data.about || '',
        badges: Array.isArray(data.badges) ? data.badges : [],
        expertise: Array.isArray(data.expertise) ? data.expertise : [],
        experience: {
          years: data.experience && data.experience.years ? data.experience.years : '',
          label: data.experience && data.experience.label ? data.experience.label : ''
        },
        accreditations: Array.isArray(data.accreditations) ? data.accreditations : [],
        education: Array.isArray(data.education) ? data.education : [],
        affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
        media: Array.isArray(data.media) ? data.media : []
      };

      modalResources[normalizedKey] = profileEntry;
      if (rawKey && rawKey !== normalizedKey) {
        modalResources[rawKey] = Object.assign({}, profileEntry);
      }
    });

    return { leadership_page: { profile_modal: modalResources } };
  }

  function mergeProfileModalResources(existingModal, fallbackModal) {
    if (!fallbackModal || typeof fallbackModal !== 'object') return existingModal || {};
    if (!existingModal || typeof existingModal !== 'object') return fallbackModal;

    const merged = {};
    Object.keys(fallbackModal).forEach(memberKey => {
      merged[memberKey] = Object.assign({}, fallbackModal[memberKey], existingModal[memberKey] || {});
    });
    Object.keys(existingModal).forEach(memberKey => {
      if (!merged.hasOwnProperty(memberKey)) {
        merged[memberKey] = existingModal[memberKey];
      }
    });
    return merged;
  }

  // Merge profile modal resources into the resource bundles for fallback translation.
  // This function will retry for a short period if the page's `window.pmaLeadershipMemberData`
  // hasn't been attached yet (leadership page may register it after translator loads).
  async function injectProfileModalResources(resources) {
    if (!resources || typeof resources !== 'object') return;

    // Try to obtain the member data, retrying briefly if not present yet.
    const MAX_ATTEMPTS = 12; // ~12 * 200ms = 2.4s
    const RETRY_MS = 200;
    let attempts = 0;
    let profileData = window.pmaLeadershipMemberData;

    while ((!profileData || typeof profileData !== 'object') && attempts < MAX_ATTEMPTS) {
      await new Promise(res => setTimeout(res, RETRY_MS));
      attempts += 1;
      profileData = window.pmaLeadershipMemberData;
    }

    const profileResources = buildProfileModalResources(profileData);
    if (!profileResources) return;

    // Merge into every loaded language's translation object so i18next can find them
    Object.keys(resources).forEach(lang => {
      resources[lang] = resources[lang] || { translation: {} };
      resources[lang].translation = resources[lang].translation || {};
      resources[lang].translation.leadership_page = resources[lang].translation.leadership_page || {};
      resources[lang].translation.leadership_page.profile_modal = mergeProfileModalResources(
        resources[lang].translation.leadership_page.profile_modal || {},
        profileResources.leadership_page.profile_modal
      );
    });

    // If i18next already initialized (in cases where injection ran after init), add resource bundle dynamically
    if (window.i18next && typeof window.i18next.addResourceBundle === 'function') {
      Object.keys(resources).forEach(lang => {
        try {
          // Merge into i18next resource store for this language namespace
          window.i18next.addResourceBundle(lang, 'translation', {
            leadership_page: window.i18next.getResource(lang, 'translation', 'leadership_page') || {}
          }, true, true);
          // Now ensure profile_modal exists
          const existing = window.i18next.getResource(lang, 'translation', 'leadership_page') || {};
          existing.profile_modal = mergeProfileModalResources(existing.profile_modal || {}, profileResources.leadership_page.profile_modal);
          window.i18next.addResourceBundle(lang, 'translation', { leadership_page: existing }, true, true);
        } catch (e) {
          // ignore addBundle failures
        }
      });
    }
  }

  // Fallback translations in case of offline usage or CORS file:// errors
  const fallbackResources = {
    en: {
      translation: {
        nav: {
          home: "Home",
          about: "About PMA",
          mediation: "Mediation",
          services: "Services",
          training: "Training",
          leadership: "Leadership",
          resources: "Resources",
          events: "Events",
          contact: "Contact Us",
          membership: "Become a Member"
        },
        hero: {
          title_part1: "Promoting Peaceful Resolution",
          title_part2: "Through Dialogue, Understanding & Respect",
          description1: "We promote mediation as an effective, efficient, confidential, and collaborative alternative to traditional litigation.",
          description2: "Through structured dialogue and professional facilitation, we help individuals, families, businesses, and institutions resolve conflicts amicably — while preserving relationships and reducing time, cost, and stress.",
          btn_consult: "Request a Free Consultation",
          btn_training: "Explore Training Programs"
        },
        features: {
          confidential_title: "Confidential & Private",
          confidential_desc: "Your discussions remain fully secure and protected.",
          faster_title: "Faster Resolution",
          faster_desc: "Resolve disputes in days or weeks instead of months.",
          cost_title: "Cost-Effective Solution",
          cost_desc: "Avoid expensive legal fees and lengthy court battles."
        },
        glance: {
          title: "PMA at a <span class='pma-about-heading-accent'>Glance</span>",
          founded: "Founded 2013–14",
          founded_label: "Pakistan's First Mediation Association",
          mediations: "2000+",
          mediations_label: "Successful Mediations & Facilitation Cases",
          mediators: "100+",
          mediators_label: "Certified Mediators Across Pakistan",
          training: "100+",
          training_label: "Training Programs Delivered",
          impact: "National Impact",
          impact_label: "Advancing ADR Awareness & Policy Reform"
        },
        about: {
          years: "YEARS",
          stat_label: "Promoting Mediation Excellence",
          tab1_title: "About PMA",
          tab1_text: "PMA (Pakistan Mediators Association) is an independent institution established to promote peaceful dispute resolution through mediation and Alternative Dispute Resolution (ADR) across Pakistan. With internationally accredited mediators and trainers, PMA works actively to advance mediation awareness, professional training, institutional ADR development, and policy advocacy. Our mission is to create accessible, confidential, and effective conflict resolution systems that help individuals, businesses, organizations, and communities resolve disputes efficiently while preserving relationships and reducing unnecessary litigation.",
          tab2_title: "Our Vision",
          tab2_text: "To establish mediation as the leading and most trusted method of dispute resolution in Pakistan, promoting a culture of constructive dialogue, mutual understanding, and peaceful coexistence.",
          tab3_title: "Our Mission",
          tab3_mission1: "To promote mediation as an accessible and effective dispute resolution mechanism",
          tab3_mission2: "To train and accredit mediators in line with international standards",
          tab3_mission3: "To collaborate with courts, government institutions, and private sectors",
          tab3_mission4: "To raise awareness about the benefits of mediation across society",
          tab4_title: "Our Impact",
          tab4_text1: "PMA has successfully trained hundreds of lawyers, Judges, professionals and has played a key role in promoting court-connected mediation initiatives in Pakistan.",
          tab4_text2: "We continue to work closely with the judiciary and stakeholders to strengthen mediation as a sustainable dispute resolution system.",
          info_phone_label: "Need Our Services?",
          info_phone_val: "Call: +92 300 000 0000",
          info_hours_label: "Opening Hours",
          info_hours_val: "Mon-Fri (9am to 5pm)",
          info_email_label: "Email Us",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "What is <span class='pma-about-heading-accent'>Mediation?</span>",
          text1: "Mediation is a voluntary, confidential, and structured process where a neutral mediator helps the parties in conflict to communicate, understand each other's perspectives and reach a mutually acceptable solution.",
          text2: "It empowers the parties to shape the outcome, preserves relationships and saves time, cost and emotional stress.",
          btn: "Understand the Mediation Process"
        },
        why_choose: {
          title: "Why Choose <span class='pma-about-heading-accent'>PMA?</span>",
          lead: "We combine international standards with local understanding to deliver ethical, effective, and sustainable ADR solutions.",
          btn: "Learn More About PMA",
          features: {
            f1_title: "International Standards", f1_desc: "We follow globally recognized mediation principles and practices.",
            f2_title: "Experienced & Certified Mediators", f2_desc: "Our panel includes highly trained and accredited professionals.",
            f3_title: "Confidential Process", f3_desc: "Your privacy is our top priority at every stage.",
            f4_title: "Faster & Amicable Outcomes", f4_desc: "We help resolve disputes efficiently and effectively.",
            f5_title: "Cost Effective", f5_desc: "A practical alternative to expensive and lengthy litigation."
          }
        },
        training: {
          title_part1: "Professional Training &",
          title_part2: "Accreditation",
          text: "PMA provides internationally aligned mediation training and professional development programs designed for lawyers, corporate professionals, HR teams, educators, and aspiring mediators. Our workshops and certification programs focus on practical dispute resolution skills, negotiation strategies, communication, and ADR frameworks.",
          features: {
            feat1: "IMI Accreditation",
            feat2: "Expert Trainers",
            feat3: "Practical Learning",
            feat4: "Global Standards"
          },
          card_text: "Our training programs meet international standards and empower professionals to become effective, ethical, and globally competent mediators.",
          btn_text: "Explore Training Programs"
        },
        services: {
          title: "Our <span class='pma-about-heading-accent'>Core</span> Services",
          list: {
            s1: { title: "Commercial & Corporate Mediation", desc: "Resolving business, partnership, contractual, and commercial disputes efficiently." },
            s2: { title: "Court-Referred Mediation", desc: "Alternative dispute resolution support for court-connected matters." },
            s3: { title: "Family & Community Mediation", desc: "Helping families and communities resolve disputes peacefully and respectfully." },
            s4: { title: "Workplace & Organizational Disputes", desc: "Addressing internal workplace conflicts and organizational disagreements." },
            s5: { title: "IMI-Certified Mediator Training", desc: "Professional mediator certification and skills development programs." },
            s6: { title: "Workshops & Awareness Programs", desc: "Educational sessions promoting ADR awareness and conflict resolution culture." },
            s7: { title: "Institutional & Policy Advisory", desc: "Supporting institutions in building ADR systems and mediation frameworks." }
          }
        },
        leadership: {
          title: "Meet Our Leadership",
          roles: {
            president: "President",
            secretary: "Secretary General",
            vp_north: "Vice President – North",
            ec_north: "Executive Committee – North"
          }
        },
        stats: {
          s1: { label: "Mediations Facilitated", unit: "+" },
          s2: { label: "Successful Resolutions", unit: "%" },
          s3: { label: "100% Private Process", value: "Confidential" },
          s4: { label: "Trained Mediators", value: "Certified" }
        },
        partners: {
          title: "Our Partners",
          p1: "Sindh High Court",
          p2: "Govt. Institutions",
          p3: "International Mediation Institute"
        },
        cta: {
          title: "Let's Talk Because We Can.",
          subtitle: "Ready to resolve your dispute peacefully? Or interested in becoming a certified mediator? Contact Us Today",
          btn1: "Request a Free Consultation",
          btn2: "Become a Certified Mediator",
          link: "Chat instantly with our team"
        },
        footer: {
          brand: {
            tagline: "Promoting peaceful resolution through dialogue, mediation, and mutual understanding across Pakistan.",
            logo_alt: "Pakistan Mediators Association"
          },
          quick_links: {
            title: "Quick Links",
            items: [
              { label: "Home", link: "index.html" },
              { label: "About PMA", link: "about.html" },
              { label: "Mediation", link: "mediation.html" },
              { label: "Services", link: "services.html" },
              { label: "Training", link: "training.html" },
              { label: "Leadership", link: "leadership.html" },
              { label: "Resources", link: "resources.html" },
              { label: "Events", link: "events.html" },
              { label: "Contact Us", link: "contact.html" }
            ]
          },
          services: {
            title: "Our Services",
            items: [
              "Mediation Services",
              "IMI-Certified Mediator Training",
              "ADR Workshops & Awareness Sessions",
              "Institutional ADR Advisory",
              "Policy & Mediation Advocacy"
            ]
          },
          contact: {
            title: "Contact Info",
            hours: "Mon To Fri (9am to 5pm)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 Pakistan Mediators Association (PMA). All rights reserved.",
            legal: [
              { label: "FAQ's", link: "faq.html" },
              { label: "Privacy Policy", link: "privacy-policy.html" },
              { label: "Complaint & Appeal Policy", link: "complaint-policy.html" },
              { label: "Terms and Conditions", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "About PMA",
            eyebrow: "About PMA",
            title_part1: "Building a Culture of",
            title_part2: "Dialogue, Resolution & Mutual Understanding",
            lead: "Pakistan Mediators Association (PMA) is committed to advancing mediation and alternative dispute resolution across Pakistan through professional training, institutional collaboration, and internationally recognized standards of practice."
          },
          about: {
            hero_img_alt: "About PMA",
            hero_eyebrow: "About PMA",
            hero_title_part1: "Building a Culture of",
            hero_title_part2: "Dialogue, Resolution & Mutual Understanding",
            hero_lead: "Pakistan Mediators Association (PMA) is committed to advancing mediation and alternative dispute resolution across Pakistan through professional training, institutional collaboration, and internationally recognized standards of practice.",
            badge_years: "YEARS",
            badge_stat_label: "Promoting Mediation<br>Excellence",
            nav_tab1: "About PMA",
            nav_tab2: "Our Vision",
            nav_tab3: "Our Mission",
            nav_tab4: "Our Impact",
            tab1_title1: "About",
            tab1_title2: "PMA",
            tab1_text: "PMA Established in 2013 and registered with the Government of Pakistan, PMA is the professional body authorized by the Centre for Effective Dispute Resolution (CEDR), United Kingdom, to deliver CEDR-model mediation training in Pakistan.<br><br>PMA has signed a Memorandum of Understanding with the Thailand Arbitration Centre (2018) and maintains strong relations with institutions in other SAARC countries.<br><br>Our association comprises internationally accredited CEDR-trained master trainers and mediators who have successfully conducted numerous training programs for judges and lawyers across Sindh, Punjab, and Islamabad, thereby raising professional standards of mediation in the country.",
            tab2_title1: "Our",
            tab2_title2: "Vision",
            tab2_text: "To establish mediation as the leading and most trusted method of dispute resolution in Pakistan, promoting a culture of constructive dialogue, mutual understanding, and peaceful coexistence.",
            tab3_title1: "Our",
            tab3_title2: "Mission",
            tab3_points: [
              "To promote mediation as an accessible and effective dispute resolution mechanism",
              "To train and accredit mediators in line with international standards",
              "To collaborate with courts, government institutions, and private sectors",
              "To raise awareness about the benefits of mediation across society"
            ],
            tab4_title1: "Our",
            tab4_title2: "Impact",
            tab4_text1: "PMA has successfully trained hundreds of lawyers, Judges, professionals and has played a key role in promoting court-connected mediation initiatives in Pakistan.",
            tab4_text2: "We continue to work closely with the judiciary and stakeholders to strengthen mediation as a sustainable dispute resolution system."
          },
          leadership: {
            title1: "Leadership",
            title2: "Messages",
            president: {
              name: "Aga Zafar Ahmad",
              role1: "Advocate Supreme Court of Pakistan",
              role2: "President",
              role3: "Pakistan Mediators Association",
              heading: "President's Message",
              quote: "Mediation is not just a professional tool, but a necessity for a developing legal system.",
              lead: "As the legal and commercial landscapes evolve, the role of ADR has never been more critical in ensuring swift, equitable, and effective justice. My focus as President is to expand our reach, ensuring that mediation becomes a cornerstone of our legal landscape.",
              read_more: "Read Full Message",
              sign_role: "Advocate Supreme Court of Pakistan<br>President, Pakistan Mediators Association",
              popup: {
                p1: "It is a profound honor to serve as the President of the Pakistan Mediators Association (PMA). As the legal and commercial landscapes evolve, the role of Alternative Dispute Resolution (ADR) has never been more critical in ensuring swift, equitable, and effective justice.",
                p2: "My journey as a founding member of this Association has been driven by a belief that mediation is not just a professional tool, but a necessity for a developing legal system. As we look toward the future, my commitment is to ensure our Association becomes a more vibrant and collaborative platform, bridging the gap between traditional litigation and modern dispute resolution.",
                p3: "Since our inception, the PMA has been dedicated to promoting and organizing the practice of mediation across Pakistan. We strive to maintain the highest standards of professional conduct and to provide a unified voice for mediators nationwide. My focus as President is to expand our reach, ensuring that Mediation becomes a cornerstone of our legal landscape, recognized by both the judiciary and the public as a vital tool for social and economic harmony.",
                commit_heading: "We are committed to:",
                commit_list: [
                  "<strong>Capacity Building & Professional Development:</strong> Continuing to facilitate high-caliber training and accreditation for mediators to ensure world-class standards of practice to keep our members' skills at the forefront of the industry.",
                  "<strong>Advocacy:</strong> Engaging with stakeholders and the judiciary to integrate mediation into the mainstream legal framework.",
                  "<strong>Innovation:</strong> Embracing modern techniques and global best practices to resolve trade, maritime, and commercial conflicts effectively.",
                  "<strong>National Conventions:</strong> We will endeavour to organize regular gatherings to share insights, celebrate successes, and strengthen our collective voice across the country.",
                  "<strong>Enhanced Coordination:</strong> We are dedicated to improving communication and engagement between all members to ensure every perspective is heard and valued.",
                  "<strong>Membership Growth:</strong> We will actively welcome new professionals to expand the reach and influence of mediation within Pakistan's legal and business communities.",
                  "<strong>Code of Conduct for Mediators:</strong> Furthermore, a key priority for this term is the establishment of a new committee dedicated to coordinating with the Pakistan Bar Council and Provincial Bar Councils. This initiative will focus on formalizing a robust Code of Conduct for Mediators, ensuring that our practice remains grounded in the highest ethical and professional standards."
                ],
                closing: "I invite you all to join us in this mission to mainstream mediation and foster a culture of harmony and professional excellence in Pakistan."
              }
            },
            founding_president: {
              name: "Anwar Kashif Mumtaz",
              role1: "Advocate Supreme Court of Pakistan",
              role2: "Accredited Mediator",
              heading: "Founding President's Message",
              quote: "Together, we can build a culture where understanding prevails over confrontation.",
              lead: "Our mission is to promote mediation as an effective tool towards ethical and accessible means of dispute resolution within our beloved country.",
              read_more: "Read Full Message",
              sign_role: "Advocate Supreme Court<br>Accredited Mediator",
              popup: {
                p1: "Today, being the founding president of Pakistan Mediators Association, I am delighted to witness the growth of platform dedicated for dialogue and peaceful dispute resolution. Our mission is to promote Mediation as an effective tool towards ethical and accessible means of dispute resolution within our beloved country. We remain committed to upholding the highest professional standards and fostering trust in alternative dispute resolution mechanisms.",
                p2: "Through collaboration, training and continuous learning, we aim to strengthen the capacity of Mediators nationwide.",
                p3: "I encourage all the stakeholders to embrace mediation as a constructive path to supplement the judiciary and towards justice and harmony.",
                closing: "Together, we can build a culture where understanding prevails over confrontation."
              }
            },
            stats: {
              s1_title: "Hundreds Trained",
              s1_text: "Lawyers, Judges & Professionals trained across Pakistan.",
              s2_title: "Court-Connected Mediation",
              s2_text: "Promoting and strengthening mediation initiatives nationwide.",
              s3_title: "Strong Collaboration",
              s3_text: "Working closely with the judiciary and stakeholders for a sustainable dispute resolution system."
            }
          }, partners: {
            title: "Our Partners",
            p1: "Sindh High Court",
            p2: "Govt. Institutions",
            p3: "International Mediation Institute"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "Mediation consultation room",
            eyebrow: "Mediation",
            title_part1: "Resolve Disputes Through",
            title_part2: "Dialogue & Understanding",
            lead: "Mediation is a voluntary, confidential, and structured process where a neutral mediator helps parties reach a mutually acceptable and sustainable resolution."
          },
          mediation: {
            title1: "What is",
            title2: "Mediation?",
            text1: "Mediation is a voluntary, confidential, and structured process in which a neutral and impartial third party — the mediator — facilitates dialogue between disputing parties to help them reach a mutually acceptable and sustainable resolution.",
            text2: "Unlike litigation, mediation emphasizes collaboration, self-determination, and creative problem-solving. It enables parties to achieve faster, more cost-effective outcomes while preserving relationships.",
            img_alt: "What is Mediation"
          }, whyChoose: {
            heading_part1: "Why Choose",
            heading_part2: "Mediation",
            heading_part3: "with PMA?",
            cards: {
              card1: {
                title: "Faster & Cost-Effective",
                desc: "Resolve disputes in weeks, not years."
              },
              card2: {
                title: "Confidential",
                desc: "Private process with no public records."
              },
              card3: {
                title: "Relationship-Preserving",
                desc: "Focus on mutual understanding and win-win solutions."
              },
              card4: {
                title: "Flexible & Collaborative",
                desc: "Parties control the outcome."
              },
              card5: {
                title: "IMI-Certified Standards",
                desc: "Internationally recognized mediator accreditation."
              }
            }
          }, banner: {
            text: "PMA is Pakistan's <strong>first and oldest</strong> dedicated organization for mediation accreditation, professional training, and advocacy — <strong>established in 2013–2014</strong> and based in Karachi."
          },
          how_it_works: {
            title_part1: "How Mediation",
            title_part2: "Works?",
            img_alt: "Mediation process",
            steps: {
              step1: {
                num: "1",
                title: "Submit Your Request",
                desc: "You contact PMA to share the details of your dispute."
              },
              step2: {
                num: "2",
                title: "Initial Case Assessment",
                desc: "We review the matter and determine its suitability for mediation."
              },
              step3: {
                num: "3",
                title: "Mediator Assignment",
                desc: "A neutral and qualified mediator is assigned to your case."
              },
              step4: {
                num: "4",
                title: "Facilitated Sessions",
                desc: "The mediator facilitates structured dialogue to explore solutions."
              },
              step5: {
                num: "5",
                title: "Resolution & Agreement",
                desc: "Parties reach a mutually acceptable outcome and formalize the agreement."
              }
            }
          },
          who_we_serve: {
            title_part1: "Who We",
            title_part2: "Serve",
            cards: {
              card1: {
                title: "Individuals & Families",
                desc: "Helping individuals and families resolve personal and civil disputes."
              },
              card2: {
                title: "Businesses & Corporations",
                desc: "Supporting businesses in resolving commercial and workplace disputes."
              },
              card3: {
                title: "Government Institutions",
                desc: "Assisting government departments in resolving public sector disputes."
              },
              card4: {
                title: "NGOs & Community Organizations",
                desc: "Facilitating conflict resolution for community and social organizations."
              },
              card5: {
                title: "Law Firms & Legal Professionals",
                desc: "Partnering with legal professionals for effective ADR solutions."
              }
            }
          },
          cta: {
            title_part1: "Let’s Resolve Conflict",
            title_part2: "Peacefully.",
            subtitle: "Mediation creates understanding. Understanding creates solutions. Contact PMA today to learn how mediation can help you.",
            btn_text: "Contact Us Today"
          }

        },
        "services-page": {
          hero: {
            img_alt: "Services Hero",
            eyebrow: "Our Services",
            title_part1: "Professional Mediation &",
            title_part2: "ADR Services",
            lead: "PMA provides a comprehensive range of mediation, training, and advisory services to help individuals, organizations, and institutions resolve disputes effectively and build a culture of dialogue."
          },
          work_with: {
            title_part1: "Who We",
            title_part2: "Work",
            title_part3: "With",
            items: {
              item1: "Law Firms & Legal Professionals",
              item2: "Corporations & Businesses",
              item3: "Government Institutions",
              item4: "NGOs & Community Organizations",
              item5: "Educational Institutions",
              item6: "Judiciary & Public Sector"
            }
          },
          services_cta: {
            title_part1: "Let's Build Better Resolution",
            title_part2: "Systems Together.",
            subtitle: "Partner with PMA for mediation services, professional training, and advisory solutions tailored to your needs.",
            btn_text: "Get in Touch"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "Contact Us Hero",
            eyebrow: "Contact Us",
            title_part1: "We're Here to",
            title_part2: "Help.",
            lead: "Whether you have a question, need guidance, or want to collaborate, our team is ready to assist you. Reach out to us and we'll get back to you as soon as possible.",
            features: {
              f1_title: "Confidential",
              f1_desc: "Your information is always protected",
              f2_title: "Responsive",
              f2_desc: "We typically respond within 24 hours",
              f3_title: "Professional",
              f3_desc: "Experienced team of mediation experts"
            }
          },
          contact_section: {
            info_col: {
              title: "Get in Touch",
              lead: "We are here to answer your questions and provide the support you need for your mediation journey.",
              labels: {
                address: "Office Address",
                email: "Email",
                phone: "Phone",
                whatsapp: "WhatsApp",
                hours: "Office Hours"
              },
              values: {
                address_text: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
                hours_text: "Monday – Friday 9:00 AM – 5:00 PM (PKT)"
              }
            },
            form_col: {
              title: "Send Us a Message",
              lead: "Share a few details and our team will get back to you.",
              labels: {
                name: "Full Name",
                email: "Email Address",
                phone: "Phone Number",
                inquiry: "Type of Inquiry",
                subject: "Subject",
                message: "Message",
                consent: "All conversations are confidential and your information is secure."
              },
              placeholders: {
                name: "Your Name",
                email: "Your Email",
                phone: "Your Phone",
                subject: "Subject of your message",
                message: "How can we help you?"
              },
              options: {
                default: "Select an option",
                general: "General Inquiry",
                mediation: "Mediation Services",
                training: "Training & Certification",
                membership: "Membership Information",
                advisory: "Institutional ADR Advisory",
                workshops: "Workshops & Awareness Sessions",
                event: "Event Participation",
                partnership: "Partnership & Collaboration",
                media: "Media & Press Inquiry",
                consultation: "Legal / Policy Consultation",
                feedback: "Complaint or Feedback",
                volunteer: "Volunteer Opportunities",
                speaker: "Speaker / Trainer Request",
                corporate: "Corporate Mediation Support",
                community: "Community Mediation Support",
                support: "Technical Website Support"
              },
              btn_text: "Send Message",
              success_msg: "Your message has been sent successfully. We will get back to you within 24 hours.",
              error_msg: "Sorry, there was an error sending your message. Please try again.",
              note: "No legal process. No court. Just resolution. We typically respond within 24 hours."
            }
          },
          "map_section": {
            "title": "Visit Our Office",
            "lead": "We welcome you to visit us at our office in Karachi.",
            "iframe_title": "PMA Office Location — 253, P.E.C.H.S., Block-6, Karachi"
          }
        },
        "faq_page": {
          "hero": {
            "img_alt": "FAQs Hero",
            "title": "FAQs",
            "lead": "Find answers to the most common questions about mediation and our services."
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "WHAT IS STANDARD CLAUSE OF MEDIATION?",
                "answer": "That any and every dispute, difference or question which may arise between the Parties to this Agreement shall be first settled by the Parties by an attempt at amicably settling the dispute through mutual negotiations. In case the disputes, differences or questions cannot be settled amicably or satisfactorily by correspondence or by mutual discussion within thirty days (30) after receipt by one party of the other party’s request for amicable settlement, it shall be referred to mediation to a panel of PMA Accredited Mediators. Mediation proceedings will be governed by the internationally recognized rules of mediation."
              },
              "q2": {
                "question": "AN ALTERNATIVE TO COST AND TIME – MEDIATION",
                "answer": "Mediation offers a faster, cost-effective, and confidential alternative to lengthy legal proceedings. It helps parties resolve disputes amicably while preserving professional and personal relationships."
              },
              "q3": {
                "question": "WHAT IS MEDIATION?",
                "answer": "Mediation is a voluntary and confidential process in which a neutral third party assists disputing parties in reaching a mutually acceptable agreement."
              },
              "q4": {
                "question": "HOW TO TRY MEDIATION?",
                "answer": "You can contact PMA through our website or office to initiate mediation services. Our team will guide you through the process and connect you with accredited mediators."
              },
              "q5": {
                "question": "BENEFITS OF MEDIATION",
                "benefits_list": {
                  "b1": "Faster dispute resolution",
                  "b2": "Lower legal costs",
                  "b3": "Confidential proceedings",
                  "b4": "Flexible solutions",
                  "b5": "Improved communication between parties"
                }
              },
              "q6": {
                "question": "WHEN WILL THE MEDIATION SESSION BE HELD?",
                "answer": "The mediation session is scheduled based on the availability of both parties and the mediator. PMA coordinates the process to ensure convenience and efficiency."
              },
              "q7": {
                "question": "WHAT HAPPENS AT MEDIATION?",
                "answer": "During mediation, both parties discuss their concerns in a structured environment facilitated by a mediator who helps explore solutions and common ground."
              },
              "q8": {
                "question": "WHAT HAPPENS IF NO AGREEMENT IS REACHED?",
                "answer": "If mediation does not result in an agreement, both parties remain free to pursue other legal or dispute resolution options available to them."
              },
              "q9": {
                "question": "WHO CAN ATTEND THE MEDIATION?",
                "answer": "Only the involved parties, their authorized representatives, legal advisors (if permitted), and the mediator may attend the mediation session."
              },
              "q10": {
                "question": "HOW MUCH WILL IT COST?",
                "answer": "The cost of mediation depends on the nature, complexity, and duration of the dispute. PMA provides fee details before the mediation process begins."
              }
            },
            "contact_box": {
              "title": "Still Have Questions?",
              "lead": "We're here to help. Reach out to us and our team will be happy to assist you.",
              "btn_text": "Contact Us"
            }
          }
        },
        "training-page": {
          "hero": {
            "hero_img_alt": "Training Hero",
            "eyebrow": "PROFESSIONAL TRAINING",
            "title_part1": "Building Pakistan's Future Mediators Through",
            "title_part2": "Internationally Recognized Training",
            "lead": "Strengthen your skills. Elevate your practice. Promote dialogue, understanding and peaceful resolution in society.",
            "banner": {
              "logo_alt": "International Mediation Institute",
              "title": "IMI-Certified Mediator Training Program",
              "tagline": "Internationally Recognized. Globally Respected.",
              "desc": "PMA is an officially registered training provider with the International Mediation Institute (IMI). Our IMI-Certified Mediator Training Program meets the highest global standards for professional mediator training.",
              "link_text": "for more information please click on the link"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "Our",
              "title_part2": "Training",
              "title_part3": "Programs"
            },
            "programs": {
              "accredited_course": {
                "badge": "Accredited Course",
                "title": "Mediation Skills Accredited Course",
                "desc_p1": "This course is for those who are interested in getting to know the mediation skills. A candidate will become an educated consumer.",
                "desc_p2": "All courses are conducted through exercises and role plays.",
                "metrics": {
                  "total_hours": "Total Hours",
                  "days": "Days (Tue - Sat)",
                  "daily_hours": "Daily Hours",
                  "cert_status": "Certificate",
                  "cert_sub": "Accredited"
                },
                "outcomes": {
                  "headline": "By the end of the course participant should be able to:",
                  "list": {
                    "item1": "Skilled in Mediation",
                    "item2": "Learn Best Practices of Mediation",
                    "item3": "Learn Pakistan laws on mediation",
                    "item4": "Learn negotiation skills",
                    "item5": "Become certified mediator"
                  }
                },
                "btn_text": "View Course Details"
              },
              "introductory_course": {
                "badge": "Non-Accredited Course",
                "title": "Mediation Skills Introductory Course",
                "desc_p1": "This course is for those who are interested in getting a know how of the mediation skills. This is a very basic level course.",
                "desc_p2": "There are no exercises or role plays.",
                "metrics": {
                  "total_hours": "Total Hours",
                  "days": "Days (To be announced)",
                  "daily_hours": "Daily Hours",
                  "cert_status": "Non-Accredited"
                },
                "btn_text": "View Course Details"
              },
              "basic_info_course": {
                "badge": "Non-Accredited Course",
                "title": "Basic Information About Mediation Skills",
                "desc_p1": "This course is for those who are interested in getting a know how of the mediation skills. This is a very basic level course.",
                "desc_p2": "There are no exercises or role plays.",
                "metrics": {
                  "total_hours": "Total Hours",
                  "days": "Day",
                  "daily_hours": "Daily Hours",
                  "cert_status": "Non-Accredited"
                },
                "btn_text": "View Course Details"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "Who",
              "title_part2": "Should",
              "title_part3": "Attend?",
              "subtitle": "This Training is Designed for Professionals Who Want to Make a Difference"
            },
            "cards": {
              "c1": {
                "title": "Lawyers & Legal Professionals",
                "desc": "Enhance your dispute resolution skills and expand your professional practice."
              },
              "c2": {
                "title": "Judges & Court Officials",
                "desc": "Strengthen your understanding of ADR and support effective case management."
              },
              "c3": {
                "title": "Corporate Professionals",
                "desc": "Improve negotiation, communication and conflict management at the workplace."
              },
              "c4": {
                "title": "HR & Admin Professionals",
                "desc": "Build people-centered conflict resolution and workplace harmony."
              },
              "c5": {
                "title": "NGOs & Community Leaders",
                "desc": "Resolve community disputes and promote social cohesion and inclusion."
              },
              "c6": {
                "title": "Students & ADR Enthusiasts",
                "desc": "Kick-start your journey in mediation and build a strong foundation in ADR."
              },
              "c7": {
                "title": "Government Officials",
                "desc": "Apply mediation skills to public sector disputes and policy implementation."
              },
              "c8": {
                "title": "Anyone Interested in ADR & Mediation",
                "desc": "Open to those passionate about peaceful dialogue and resolving disputes."
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "Different backgrounds, one goal",
            "title": "Different backgrounds. One goal: Peaceful Resolution.",
            "desc": "Our training brings together diverse professionals who believe in dialogue, understanding and building better communities.",
            "btn_text": "Register for a Course"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "Join Our Program",
              "title": "Join Our Mediation Training Programs",
              "tagline": "Take the First Step Towards Excellence",
              "desc": "Register today and become part of internationally recognized training programs designed to build your skills, empower your practice and promote peaceful resolution in society.",
              "img_alt": "Zen meditation stones",
              "seat_badge": {
                "title": "Secure Your Seat",
                "desc_part1": "Limited seats",
                "desc_part2": "available in each batch."
              }
            },
            "form_panel": {
              "header_title": "Registration Details",
              "labels": {
                "name": "Full Name",
                "email": "Email Address",
                "phone": "Phone Number",
                "background": "Professional Background",
                "city": "City",
                "program": "Select Training Program",
                "additional_info": "Additional Information (Optional)"
              },
              "placeholders": {
                "name": "Enter your full name",
                "email": "Enter your email address",
                "phone": "Enter your phone number",
                "background": "e.g. Lawyer, HR Professional, Student",
                "city": "Enter your city",
                "program_default": "-- Please choose a program --",
                "additional_info": "Any additional information you would like to share"
              },
              "options": {
                "accredited": "Mediation Skills Accredited Course",
                "introductory": "Mediation Skills Introductory Course",
                "basic": "Basic Information About Mediation Skills"
              },
              "btn_text": "Apply for Enrollment",
              "privacy_note": "Your information is safe and will only be used for registration purposes.",
              "messages": {
                "success": "Registration submitted! We'll contact you within 24 hours.",
                "error": "Sorry, there was an error submitting your registration. Please try again."
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "IMI Recognized",
                "desc": "Our programs are certified by the International Mediation Institute (IMI)."
              },
              "b2": {
                "title": "Expert Trainers",
                "desc": "Learn from experienced mediators and industry professionals."
              },
              "b3": {
                "title": "International Standards",
                "desc": "Training aligned with globally accepted mediation standards."
              },
              "b4": {
                "title": "Professional Certification",
                "desc": "Earn a recognized certificate upon successful completion."
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "Accredited Course",
              "title_part1": "Mediation Skills",
              "title_part2": "Accredited Course",
              "desc": "This course is for those who are interested in getting to know the mediation skills. A candidate will become an educated consumer. All courses are conducted through exercises and role plays.",
              "stats": {
                "type": { "label": "Accredited Course", "value": "Certificate Accredited" },
                "total_hours": { "label": "Total Hours", "value": "40" },
                "duration": { "label": "Duration", "value": "5 Days (One Week)" },
                "daily_hours": { "label": "Daily Hours", "value": "8" },
                "days": { "label": "Training Days", "value": "Tuesday to Saturday" },
                "time": { "label": "Training Time", "value": "9 AM – 5 PM" }
              }
            },
            "main_content": {
              "about": {
                "title": "About This Course",
                "desc": "This comprehensive program equips participants with practical mediation skills, negotiation techniques, and an understanding of Pakistani laws on mediation. Through experiential learning, exercises, and role plays, participants will be prepared to handle real-life disputes effectively and ethically."
              },
              "outcomes": {
                "title": "What You Will Learn",
                "items": [
                  "Skilled in Mediation",
                  "Learn Best Practices of Mediation",
                  "Learn Pakistani laws on mediation",
                  "Learn negotiation skills",
                  "Become certified mediator",
                  "Draft effective settlement agreements"
                ]
              },
              "columns": {
                "outline": {
                  "title": "Course Outline",
                  "items": [
                    "Landscape of Alternate Dispute Resolution",
                    "Phases of Mediation",
                    "Non-verbal and verbal communication",
                    "Negotiation Style",
                    "Question Techniques",
                    "Zone of Potential Agreement",
                    "Breaking the deadlock",
                    "Draft of Settlement Agreement",
                    "Cases Appropriate for Mediation",
                    "Self-assessment",
                    "Bargaining Techniques"
                  ]
                },
                "structure": {
                  "title": "Course Structure",
                  "modules": [
                    { "badge": "Module 01", "title": "Landscape of ADR" },
                    { "badge": "Module 02", "title": "Mediation Process & Phases" },
                    { "badge": "Module 03", "title": "Communication & Questioning" },
                    { "badge": "Module 04", "title": "Negotiation Techniques" },
                    { "badge": "Module 05", "title": "Deadlock Resolution" },
                    { "badge": "Module 06", "title": "Settlement Drafting & Closure" },
                    { "badge": "Module 07", "title": "Self Assessment & Best Practices" }
                  ]
                },
                "methodology": {
                  "title": "Training Methodology",
                  "items": [
                    "Experiential Learning",
                    "Practical Exercises",
                    "Role Plays & Simulations",
                    "Group Discussions",
                    "Case Studies",
                    "Interactive Sessions"
                  ]
                }
              },
              "certification": {
                "title": "Certification Outcome",
                "desc": "Participants will receive a Certificate of Completion upon successful participation. The course prepares individuals to apply mediation skills ethically, professionally, and effectively in diverse settings."
              },
              "attendees": {
                "title": "Who Should Attend?",
                "items": [
                  "Lawyers & Legal Professionals",
                  "Judges & Court Officials",
                  "Corporate Professionals",
                  "HR & Admin Professionals",
                  "NGOs & Community Leaders",
                  "Students & ADR Enthusiasts"
                ]
              },
              "btn_text": "Apply for This Program"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "Non-Accredited Course",
              "title_part1": "Mediation Skills",
              "title_part2": "Introductory Course",
              "desc": "This course is designed for those who are interested in getting a know how of the mediation skills. This is a very basic level course and is non-accredited.",
              "stats": {
                "type": { "label": "Non-Accredited Course", "value": "" },
                "total_hours": { "label": "Total Hours", "value": "16" },
                "duration": { "label": "Duration", "value": "2 Business Days" },
                "daily_hours": { "label": "Daily Hours", "value": "8" },
                "days": { "label": "Training Days", "value": "Any Two Days (To Be Announced)" },
                "time": { "label": "Training Time", "value": "9 AM – 5 PM" }
              }
            },
            "main_content": {
              "about": {
                "title": "About This Course",
                "desc": "This introductory course provides a basic understanding of mediation skills and the mediation process. Participants will become educated consumers of mediation and will be able to understand what future does it hold for anyone. This course is theory-oriented with no exercises or role plays."
              },
              "outcomes": {
                "title": "What You Will Learn",
                "items": [
                  "Understand the basics of mediation",
                  "Learn key mediation concepts",
                  "Understand when mediation can be used",
                  "Awareness of mediation process",
                  "Become an educated consumer"
                ]
              },
              "columns": {
                "outline": {
                  "title": "Course Outline",
                  "items": [
                    "Landscape of Alternate Dispute Resolution",
                    "Phases of Mediation",
                    "Non-verbal and verbal communication",
                    "Negotiation Style",
                    "Question Techniques",
                    "Zone of Potential Agreement",
                    "Breaking the deadlock",
                    "Draft of Settlement Agreement",
                    "Cases Appropriate for Mediation",
                    "Bargaining Techniques"
                  ]
                },
                "info_table": {
                  "title": "Course Information",
                  "trainer": { "label": "Trainer", "value": "To Be Announced (TBA)" },
                  "daily_hours": { "label": "Daily Hours", "value": "Eight (8)" },
                  "total_hours": { "label": "Total Hours", "value": "Sixteen (16)" },
                  "days": { "label": "Training Days", "value": "Any Two Days (To Be Announced)" },
                  "time": { "label": "Training Time", "value": "9 AM – 5 PM" },
                  "duration": { "label": "Course Duration", "value": "Two (2) Business Days" },
                  "type": { "label": "Course Type", "value": "Non-Accredited Course" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "Who Should Attend?",
                  "items": [
                    "Students & Fresh Graduates",
                    "Professionals from Any Field",
                    "HR & Admin Professionals",
                    "NGOs & Community Workers",
                    "Anyone Interested in Mediation"
                  ]
                },
                "note": {
                  "title": "Important Note",
                  "desc": "This is a basic level course designed to provide knowledge and awareness only. There are no exercises, role plays or self-assessment in this course."
                }
              },
              "btn_text": "Register for This Course"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "Non-Accredited Course",
              "title_part1": "Basic Information About",
              "title_part2": "Mediation Skills",
              "desc": "This introductory course is designed to provide general awareness of mediation skills and their application. This is a basic level course and is non-accredited.",
              "stats": {
                "type": { "label": "Non-Accredited Course", "value": "" },
                "total_hours": { "label": "Total Hours", "value": "8" },
                "duration": { "label": "Duration", "value": "1 Day" },
                "daily_hours": { "label": "Daily Hours", "value": "8" },
                "days": { "label": "Training Days", "value": "Any Day (To Be Announced)" },
                "time": { "label": "Training Time", "value": "9 AM – 5 PM" }
              }
            },
            "main_content": {
              "about": {
                "title": "About This Course",
                "desc": "This basic information course is designed to provide general awareness of mediation skills, the mediation process, and key dispute resolution concepts. Participants will gain a foundational understanding of how mediation functions without engaging in role plays or practical exercises."
              },
              "outcomes": {
                "title": "What You Will Learn",
                "items": [
                  "Understand the basics of mediation",
                  "Learn key mediation concepts",
                  "Understand when mediation can be used",
                  "Awareness of mediation process",
                  "Foundational dispute resolution concepts"
                ]
              },
              "columns": {
                "outline": {
                  "title": "Course Outline",
                  "items": [
                    "Landscape of Alternate Dispute Resolution",
                    "Phases of Mediation",
                    "Introduction to Mediation",
                    "Mediation Process Overview",
                    "Communication in Mediation",
                    "Questions & Clarifications",
                    "Understanding deadlocks",
                    "Basics of Agreement"
                  ]
                },
                "info_table": {
                  "title": "Course Information",
                  "trainer": { "label": "Trainer", "value": "To Be Announced (TBA)" },
                  "daily_hours": { "label": "Daily Hours", "value": "Eight (8)" },
                  "total_hours": { "label": "Total Hours", "value": "Eight (8)" },
                  "days": { "label": "Training Days", "value": "Any Day (To Be Announced)" },
                  "time": { "label": "Training Time", "value": "9 AM – 5 PM" },
                  "duration": { "label": "Course Duration", "value": "One (1) Day" },
                  "type": { "label": "Course Type", "value": "Non-Accredited Course" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "Who Should Attend?",
                  "items": [
                    "Students & Fresh Graduates",
                    "Professionals from Any Field",
                    "HR & Admin Professionals",
                    "NGOs & Community Workers",
                    "Anyone Interested in Mediation"
                  ]
                },
                "note": {
                  "title": "Important Note",
                  "desc": "This is a basic level course designed to provide general information and awareness only. There are no exercises, role plays or self-assessment in this course."
                }
              },
              "btn_text": "Register for This Course"
            }
          }

        },
        "leadership_page": {
          "hero": {
            "eyebrow": "Leadership",
            "title_main": "Leadership",
            "title_accent": "Our People. Our Strength",
            "lead_text": "Meet the dedicated professionals leading PMA's mission of promoting dialogue, understanding and peaceful resolution across Pakistan."
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "Executive Team",
              "sub_committee": "Sub Committee",
              "mediator": "Mediators",
              "trainer": "Trainers",
              "former_president": "Former Presidents"
            },
            "search_placeholder": "Search by name or expertise..."
          },
          "modal": {
            "about_label": "About",
            "expertise_title": "Expertise",
            "training_expertise_title": "Training Expertise",
            "accreditations_title": "Accreditations",
            "education_title": "Education",
            "affiliations_title": "Professional Affiliations",
            "media_title": "Media & Public Engagement",
            "coming_soon": "Coming Soon",
            "profile_close_label": "Close profile"
          },
          "profile_modal": {
            "aga_zafar_ahmed": {
    "name": "Aga Zafar Ahmed",
    "role": "President",
    "highlight": "\"Advancing mediation and international dispute resolution through leadership, advocacy, and ADR excellence.\"",
    "about": "Mr. Aga Zafar Ahmed is the President of Pakistan Mediators Association (PMA) and a distinguished Advocate of the Supreme Court of Pakistan with more than 21 years of legal practice. He is widely recognized for his expertise in Admiralty & Maritime Law, commercial disputes, international trade matters, and Alternative Dispute Resolution (ADR). As a Founding Member of PMA, he continues to play a leading role in advancing mediation and peaceful dispute resolution practices across Pakistan.",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Executive Leadership"],
    "expertise": ["Commercial Disputes", "Maritime & Admiralty Law", "International Trade Disputes", "Corporate Mediation", "Civil Litigation", "Alternative Dispute Resolution (ADR)"],
    "experience": { "years": "21+ Years", "label": "Legal Practice & Dispute Resolution" },
    "accreditations": ["CEDR Accredited Mediator (London)", "MICADR Empaneled Mediator", "PMA Accredited Mediator", "Diploma in International Arbitration Law"],
    "education": ["Diploma in International Arbitration Law – College of Law, England & Wales"],
    "affiliations": ["Supreme Court Bar Association of Pakistan", "Sindh High Court Bar Association", "Pakistan Mediators Association (Founding Member)", "Bahria University (Former Visiting Faculty)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "Saima Amin Khawaja",
    "role": "Vice President – North",
    "highlight": "\"Promoting legal reform, mediation excellence, and sustainable dispute resolution through education and institutional leadership.\"",
    "about": "Ms. Saima Amin Khawaja is the Vice President – North of Pakistan Mediators Association (PMA) and an accomplished legal professional with extensive experience in corporate litigation, constitutional law, transactional advisory, and legal reform consultancy. She is an internationally trained mediator and Master Trainer with a strong commitment to advancing ADR, environmental law, and professional legal education in Pakistan.",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Training Committee"],
    "expertise": ["Corporate Litigation", "Constitutional Law", "Legal Reforms & Consultancy", "Environmental Law", "Mediation & ADR Training", "Climate Change Policy"],
    "experience": { "years": "20+ Years", "label": "Legal Practice, Training & Consultancy" },
    "accreditations": ["CEDR Accredited Mediator", "CEDR Master Trainer", "PMA Accredited Mediator", "Environmental Law Training – M.C. Mehta Foundation, India"],
    "education": ["LL.M – King's College London"],
    "affiliations": ["Pakistan Mediators Association", "Climate Change Commission – Lahore High Court", "Civil Services Academy", "Judicial Academy", "Lahore University of Management Sciences (LUMS)", "University College Lahore (UCL)", "The Institute of Legal Studies (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "Asfand Yar Ali Khan",
    "role": "Vice President – North",
    "highlight": "\"Advancing mediation, arbitration, and legal reform through leadership, training, and institutional expertise.\"",
    "about": "Barrister Asfand Yar Ali Khan is the Vice President – North of Pakistan Mediators Association (PMA) and a Founding Member of the organization. Called to the Bar by The Honorable Society of Lincoln's Inn, he is an accomplished law and development practitioner with extensive expertise in mediation, arbitration, environmental law, and regulatory matters. He actively contributes to strengthening ADR practices and legal reform initiatives across Pakistan.",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Code of Conduct"],
    "expertise": ["Arbitration & ADR", "Labor & Employment Law", "Environmental Law", "Family & Land Disputes", "Regulatory Matters", "Mediation Training"],
    "experience": { "years": "20+ Years", "label": "Legal Practice, ADR & Tribunal Leadership" },
    "accreditations": ["CEDR Accredited Mediator", "CEDR Master Trainer", "Member – Chartered Institute of Arbitrators (MCIArb), London", "PMA Accredited Mediator"],
    "education": ["Post-Graduate Diploma in Professional Legal Skills – The City St. Georges, UK", "LL.B (Hons) – University of Hull, UK", "M.Phil – Pakistan", "M.A – Pakistan", "B.A – Pakistan"],
    "affiliations": ["Pakistan Mediators Association (Founding Member)", "Chartered Institute of Arbitrators, London", "Khyber Pakhtunkhwa Environmental Protection Tribunal", "Lincoln's Inn, London"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "Wajiha Aleem",
    "role": "Secretary General",
    "highlight": "\"Advancing mediation through leadership, innovation, and international collaboration for a stronger ADR framework in Pakistan.\"",
    "about": "Ms. Wajiha Aleem serves as the Secretary General of Pakistan Mediators Association (PMA), leading strategic initiatives focused on strengthening mediation and institutionalizing Alternative Dispute Resolution (ADR) across Pakistan. With over 17 years of corporate and legal experience, she is committed to advancing mediation as a credible, accessible, and globally aligned dispute resolution mechanism through innovation, policy reform, judicial collaboration, and international partnerships.",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Executive Leadership"],
    "expertise": ["Alternative Dispute Resolution (ADR)", "Corporate & Legal Advisory", "Mediation Training", "Institutional Development", "Policy Reform", "International ADR Collaboration"],
    "experience": { "years": "17+ Years", "label": "Corporate, Legal & ADR Leadership" },
    "accreditations": ["CEDR UK Certified Mediator", "PMA Accredited Mediator", "International ADR Practitioner"],
    "education": ["LL.M – United Kingdom", "B.A. LL.B. (Hons.) – University of Karachi"],
    "affiliations": ["Pakistan Mediators Association", "International ADR & Mediation Networks", "Judicial & Institutional ADR Initiatives"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "Aga Zafar Ahmed",
    "role": "Master Trainer",
    "highlight": "\"Advancing mediation and international dispute resolution through leadership, advocacy, and ADR excellence.\"",
    "about": "Aga Zafar Ahmed is a distinguished Advocate of the Supreme Court of Pakistan, accredited mediator, and senior ADR professional with extensive expertise in Admiralty & Maritime Law, civil litigation, commercial disputes, and international trade matters. As President of the Pakistan Mediators Association (PMA), he continues to play a key role in strengthening mediation practices and promoting institutional dispute resolution frameworks in Pakistan.\n\nHe is a CEDR UK Accredited Mediator and serves on the panel of the High Court of Sindh as a Mediator while also being associated with the Musaliha International Centre for ADR (MICADR). In addition to his legal practice, he has contributed to legal education and professional development as a visiting faculty member and institutional leader.",
    "badges": ["Master Trainer", "President", "Executive Leadership"],
    "expertise": ["ADR & Mediation Training", "Commercial Dispute Resolution", "Admiralty & Maritime Law", "International Trade Disputes", "Arbitration & Conflict Resolution", "Civil & Corporate Litigation", "Train the Trainer (TOT)"],
    "experience": { "years": "21+ Years", "label": "Legal Practice & Dispute Resolution" },
    "accreditations": ["CEDR UK Accredited Mediator", "Panel Mediator – High Court of Sindh", "Member – Musaliha International Centre for ADR (MICADR)", "Diploma in International Arbitration Law – England & Wales"],
    "education": ["Diploma in International Arbitration Law – College of Law, England & Wales"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Musaliha International Centre for ADR (MICADR)", "High Court of Sindh", "Supreme Court Bar Association of Pakistan", "Sindh High Court Bar Association", "Bahria University"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "Mustansir Zakir",
    "role": "Master Trainer",
    "highlight": "\"Leading corporate governance and mediation training initiatives through strategic leadership and ADR excellence.\"",
    "about": "Mustansir Zakir is a senior corporate leader, accredited mediator, and internationally recognized ADR trainer with extensive experience in strategic management, corporate governance, and dispute resolution. He serves as Director Training and Executive Member of the Pakistan Mediators Association (PMA) and has played a significant role in promoting mediation and ADR awareness across Pakistan.\n\nA Fellow Member of ICAP, ICMAP, and ICSP, he currently works with the Hashoo Group as Chief Executive. He has completed Strategic Management Certification from Cornell University, USA, and Certified Director Education from the Pakistan Institute of Corporate Governance. As a CEDR UK Accredited Mediator and Master Trainer, he has contributed extensively to professional mediation training, leadership development, and institutional ADR initiatives in Pakistan.",
    "badges": ["Master Trainer", "Director Training", "Executive Committee – South", "Ex-President"],
    "expertise": ["ADR & Mediation Training", "Corporate Governance", "Strategic Management", "Executive Leadership Development", "Commercial Dispute Resolution", "Train the Trainer (TOT)", "Institutional Capacity Building"],
    "experience": { "years": "20+ Years", "label": "Executive Leadership & ADR Training" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Certified Director – Pakistan Institute of Corporate Governance", "Strategic Management Certification – Cornell University, USA"],
    "education": ["Fellow – Institute of Chartered Accountants of Pakistan (ICAP)", "Fellow – Institute of Cost & Management Accountants of Pakistan (ICMAP)", "Fellow – Institute of Corporate Secretaries of Pakistan (ICSP)"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Hashoo Group", "Pakistan Hotels Association (PHA)", "Association of Builders and Developers of Pakistan (ABAD)", "Institute of Chartered Accountants of Pakistan (ICAP)", "Pakistan Institute of Corporate Governance", "Karachi Sea Scout Council Trust"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "Wajiha Aleem",
    "role": "Master Trainer",
    "highlight": "\"Advancing mediation through leadership, innovation, and international collaboration for a stronger ADR framework in Pakistan.\"",
    "about": "Wajiha Aleem is an Advocate of the High Court, accredited mediator, and legal professional with extensive experience in corporate operations, legal advisory, and Alternative Dispute Resolution (ADR). She currently serves as Secretary General of the Pakistan Mediators Association (PMA) while also holding the position of General Manager (Operations & Legal) at Hashoo Group.\n\nShe holds an LL.M. in International Commercial Law & Alternative Dispute Resolution from the United Kingdom and is a CEDR Accredited Mediator with international affiliations including the Thailand Arbitration Centre (THAC). She is empaneled as a Mediator with the High Court of Sindh and remains actively involved with leading legal and professional associations nationally and internationally.",
    "badges": ["Master Trainer", "Secretary General", "Executive Leadership"],
    "expertise": ["ADR & Mediation Training", "International Commercial Law", "Corporate Legal Advisory", "Commercial Dispute Resolution", "Institutional ADR Development", "Professional Skills Training", "Conflict Resolution"],
    "experience": { "years": "17+ Years", "label": "Corporate, Legal & ADR Leadership" },
    "accreditations": ["CEDR Accredited Mediator", "Panel Mediator – High Court of Sindh", "Associate Trainer – PMA", "THAC Chapter Affiliation – Thailand Arbitration Centre"],
    "education": ["LL.M. in International Commercial Law & ADR – United Kingdom", "B.A. LL.B. (Hons.) – Pakistan"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Thailand Arbitration Centre (THAC)", "High Court of Sindh", "Sindh Bar Council", "Karachi Bar Association", "International Bar Association", "Hashoo Group"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "Huma Shah",
    "role": "Master Trainer",
    "highlight": "\"Advancing corporate legal excellence and mediation training through leadership, advocacy, and professional mentorship.\"",
    "about": "Huma Shah is a highly experienced legal professional, corporate consultant, and accredited ADR trainer with over three decades of legal practice. Since 1993, she has worked with some of Pakistan's most prominent legal institutions including AGHS Legal Aid Cell, AGHS Law Associates under Mrs. Asma Jehangir and Ms. Hina Jilani, and M/s Surridge & Beecheno.\n\nShe has served as Managing Partner at M/s Sheikh Shah Rana & Ijaz (SSR&I) and currently serves as Legal Head – North at HBL. She is an Accredited Trainer of the Advocacy Training Programme Pakistan under the Inns of Court Advocacy Committee (IATC) of the Bar Council of England & Wales, and a CEDR UK Accredited Mediator & Master Trainer.",
    "badges": ["Master Trainer", "Executive Committee – North", "Training Committee"],
    "expertise": ["ADR & Mediation Training", "Corporate & Commercial Law", "Advocacy & Legal Skills Training", "Contract Drafting & Vetting", "Banking & Corporate Legal Advisory", "Conflict Resolution", "Train the Trainer (TOT)"],
    "experience": { "years": "30+ Years", "label": "Legal Practice, Corporate Advisory & ADR Training" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Accredited Trainer – Advocacy Training Programme Pakistan (IATC)"],
    "education": ["Punjab Law College – Twice Awarded Gold Medals for Academic Merit"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Inns of Court Advocacy Committee (IATC)", "Bar Council of England & Wales", "Habib Bank Limited (HBL)", "Punjab Bar Associations", "AGHS Legal Aid Cell", "M/s Surridge & Beecheno"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "Usman G. Rashid",
    "role": "Master Trainer",
    "highlight": "\"Combining legal advocacy, mediation expertise, and training leadership to build ADR capacity across Pakistan.\"",
    "about": "Usman G. Rashid is a Barrister-at-Law, Advocate of the High Courts, CEDR Accredited Mediator, and Master Trainer with extensive experience in legal practice, advocacy training, mediation, and legal education. He holds an LL.B. (Hons.) from the University of London, an LL.M. from King's College London, and completed the Bar Vocational Course from the University of the West of England, Bristol, U.K. He was called to the Bar by the Hon'ble Society of Lincoln's Inn.\n\nHe previously served as Secretary General of the Pakistan Mediators Association (PMA) and has actively contributed to mediation awareness, ADR capacity building, and professional legal training initiatives in Pakistan. Alongside his legal practice, he is engaged in legal education and advocacy training, particularly in Company Law and Law of Evidence for the University of London External Programme.\n\nUsman began his professional career with Umar Bandial & Associates and currently manages his legal practice through Inayatullah Chambers, Advocates & Legal Consultants. His combined expertise in litigation, ADR, legal education, and advocacy training enables him to contribute effectively toward institutional ADR development and professional mediation practices.",
    "badges": ["Master Trainer", "Barrister-at-Law", "Former Secretary General – PMA"],
    "expertise": ["ADR & Mediation Training", "Advocacy Skills Training", "Company Law", "Law of Evidence", "Commercial & Civil Litigation", "Legal Education & Professional Development", "Conflict Resolution"],
    "experience": { "years": "15+ Years", "label": "CEDR Accredited Master Trainer, Advocacy & Legal Education" },
    "accreditations": ["CEDR Accredited Mediator & Master Trainer – UK", "Barrister-at-Law – Lincoln's Inn", "Certified Advocacy Trainer"],
    "education": ["LL.M. – King's College, University of London", "LL.B. (Hons.) – University of London", "Bar Vocational Course – University of the West of England, Bristol, U.K."],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Hon'ble Society of Lincoln's Inn", "University College Lahore", "University of London External Programme", "Inayatullah Chambers, Advocates & Legal Consultants"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "Asfand Yar Ali Khan",
    "role": "Master Trainer",
    "highlight": "\"Advancing mediation, arbitration, and legal reform through leadership, training, and institutional expertise.\"",
    "about": "Asfand Yar Ali Khan is a senior legal practitioner, accredited mediator, and internationally trained ADR expert with extensive experience in legal consultancy, arbitration, institutional development, and mediation training. As Senior Partner at S&K Partnership and Vice President of Pakistan Mediators Association (PMA), he actively contributes to strengthening mediation and alternative dispute resolution frameworks in Pakistan.\n\nCalled to the Bar by Lincoln's Inn, London, he is a CEDR UK Accredited Mediator & Master Trainer and a Member of the Chartered Institute of Arbitrators (MCIArb), London. His professional background spans legal practice, international development initiatives, policy engagement, and institutional advisory roles including work with the United Nations and UNDP projects.",
    "badges": ["Master Trainer", "Executive Leadership", "Vice President – North"],
    "expertise": ["ADR & Mediation Training", "Arbitration & Conflict Resolution", "Commercial & Civil Disputes", "Legal Skills Development", "Institutional ADR Capacity Building", "Professional Development Programs", "Train the Trainer (TOT)"],
    "experience": { "years": "20+ Years", "label": "Legal Practice, ADR & Tribunal Leadership" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Member – Chartered Institute of Arbitrators (MCIArb), London", "Barrister-at-Law – Lincoln's Inn, London"],
    "education": ["Post-Graduate Diploma in Professional Legal Skills – UK", "LL.B (Hons) – UK", "M.A – Pakistan", "B.A – Pakistan"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Chartered Institute of Arbitrators, London", "Lincoln's Inn, London", "Pakistan Red Crescent Society (PRCS)", "Pakistan Environmental Law Association", "British Alumni Association", "United Nations Development Initiatives"],
    "media": []
  },
 "trainer_saima_amin_khawaja": {
    "name": "Saima Amin Khawaja",
    "role": "Master Trainer",
    "highlight": "\"Promoting legal reform, mediation excellence, and sustainable dispute resolution through education and institutional leadership.\"",
    "about": "Saima Amin Khawaja is an accomplished legal professional, accredited mediator, and internationally trained ADR expert with extensive experience in corporate litigation, constitutional law, legal consultancy, and institutional reform. She has played a key role in advancing mediation awareness, ADR training, and legal development initiatives in Pakistan.\n\nShe holds an LL.M from King's College London and has received specialized training in Environmental Laws from the M.C. Mehta Foundation, India. As a CEDR UK Accredited Mediator & Master Trainer, she has actively contributed to professional mediation training and capacity-building programs. She has taught at LUMS, Civil Services Academy, Judicial Academy, TILS, and UCL, while also serving on the Climate Change Commission constituted by the Lahore High Court.",
    "badges": ["Master Trainer", "Executive Member", "Vice President – North"],
    "expertise": ["ADR & Mediation Training", "Corporate & Constitutional Law", "Legal Reforms & Policy Development", "Environmental Law", "Judicial & Professional Training", "Conflict Resolution", "Train the Trainer (TOT)"],
    "experience": { "years": "20+ Years", "label": "Legal Practice, Training & Consultancy" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Specialized Environmental Law Training – M.C. Mehta Foundation, India"],
    "education": ["LL.M – King's College London"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Lahore High Court", "Lahore University of Management Sciences (LUMS)", "Civil Services Academy", "Judicial Academy", "TILS", "UCL", "M.C. Mehta Foundation, India"]
  },
  "trainer_tariq_saeed_rana": {
    "name": "Tariq Saeed Rana",
    "role": "Master Trainer",
    "highlight": "\"Leading corporate legal practice and mediation excellence through international expertise, professional training, and ADR leadership.\"",
    "about": "Tariq Saeed Rana is a senior legal consultant, accredited mediator, and internationally recognized ADR trainer with extensive expertise in corporate and commercial law. Called to the Bar by the Society of Lincoln's Inn, UK, he currently heads the Corporate & Commercial Law division at Surridge & Beecheno and continues to contribute significantly to mediation training, legal consultancy, and institutional ADR development in Pakistan.\n\nHe is a CEDR UK Accredited Mediator & Master Trainer with extensive experience in corporate governance, legal advisory, and professional capacity building. He actively conducts professional and directors' training programs while maintaining leadership roles within legal and business institutions.",
    "badges": ["Master Trainer", "Ex-President", "Executive Committee – North"],
    "expertise": ["ADR & Mediation Training", "Corporate & Commercial Law", "Directors' Training Programs", "Corporate Governance", "Commercial Dispute Resolution", "Professional Legal Development", "Train the Trainer (TOT)"],
    "experience": { "years": "25+ Years", "label": "Legal Practice, ADR & Corporate Advisory" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Called to the Bar – Lincoln's Inn, UK"],
    "education": ["LL.M. in Commercial Laws – United Kingdom", "Post Graduate Diploma in Law – United Kingdom", "LL.B – Pakistan", "Associate Engineering (Mechanical) – Pakistan"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Society of Lincoln's Inn, London", "General Council of the Bar of England & Wales", "Lahore High Court Bar Association", "Punjab Bar Council", "Lahore Chamber of Commerce & Industry", "Surridge & Beecheno"]
  },
  "saeed_habib": {
    "name": "Saeed Habib",
    "role": "Vice President – South",
    "highlight": "",
    "about": "",
    "badges": ["Membership Committee", "Institutional Coordination"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "shabana_ali": {
    "name": "Shabana Ali",
    "role": "Vice President – South",
    "highlight": "\"Promoting mediation, legal awareness, and social justice through advocacy, education, and dispute resolution.\"",
    "about": "Ms. Shabana Ali is the Vice President – South of Pakistan Mediators Association (PMA) and an experienced civil, tax, and corporate lawyer with a strong background in litigation, advisory services, and dispute resolution. She is actively involved in advancing mediation practices in Pakistan and is widely recognized for her commitment to legal empowerment, social justice, and the protection of women and children's rights.",
    "badges": ["Executive Team", "Mediator", "PMA Accredited Mediator", "Bar Coordination – South", "Leadership"],
    "expertise": ["Civil Law", "Corporate Law", "Family Disputes", "Tax Law", "Mediation & ADR", "Women & Child Rights Advocacy"],
    "experience": { "years": "20+ Years", "label": "Legal Practice, Mediation & Public Advocacy" },
    "accreditations": ["PMA Accredited Mediator", "Certified Mediation Practitioner"],
    "education": ["Legal & Professional Studies in Civil, Corporate & Tax Law"],
    "affiliations": ["Pakistan Mediators Association", "Pakistan Institute of Public Finance Accountants (PIPFA)", "Executive Committee – PMA", "Media Legal Analyst & Speaker"]
  },
  "syed_sammad_ul_haque": {
    "name": "Syed Sammad-ul-Haque",
    "role": "Finance Secretary",
    "highlight": "",
    "about": "",
    "badges": ["Membership Committee", "Executive Leadership"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "tariq_saeed_rana": {
  "name": "Tariq Saeed Rana",
  "role": "Executive Committee – North",
  "highlight": "\"Leading corporate legal practice and mediation excellence through international expertise, professional training, and ADR leadership.\"",
  "about": "Barrister Tariq Saeed Rana is a senior legal professional, Accredited Mediator, and Master Trainer with extensive expertise in corporate and commercial law. Called to the Bar by the Society of Lincoln's Inn, UK, he currently heads the Corporate & Commercial Law division at Surridge & Beecheno. With decades of experience in legal consultancy, ADR, and professional training, he continues to play a significant leadership role in advancing mediation and institutional legal development in Pakistan.",
  "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Ex-President"],
  "expertise": ["Corporate & Commercial Law", "Mediation & ADR", "International Commercial Disputes", "Legal Consultancy", "Corporate Governance", "Professional Training"],
  "experience": { "years": "25+ Years", "label": "Legal Practice, ADR & Corporate Advisory" },
  "accreditations": ["CEDR Accredited Mediator", "CEDR Master Trainer", "Called to the Bar – Lincoln's Inn, UK", "PMA Accredited Mediator"],
  "education": ["LL.M. (Commercial Laws) – United Kingdom", "Post Graduate Diploma in Law – United Kingdom", "LL.B. – Pakistan", "Associate Engineering (Mechanical) – Pakistan"],
  "affiliations": ["General Council of the Bar of England & Wales", "Society of Lincoln's Inn, London", "Pakistan Mediators Association", "Lahore High Court Bar Association", "Punjab Bar Council", "Lahore Chamber of Commerce & Industry"],
  "media": []
},
  "huma_shah": {
    "name": "Huma Shah",
    "role": "Executive Committee – North",
    "highlight": "\"Advancing corporate legal excellence and mediation training through leadership, advocacy, and professional mentorship.\"",
    "about": "Ms. Huma Shah is a senior legal professional with extensive experience in corporate law, legal consultancy, commercial drafting, and dispute resolution. Practicing since 1993, she has worked with leading legal institutions and law firms including AGHS Legal Aid Cell, AGHS Law Associates, and Surridge & Beecheno. She currently serves as Legal Head – North at HBL and continues to contribute significantly to mediation training and ADR development in Pakistan.",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Master Trainer", "Training Committee"],
    "expertise": ["Corporate & Commercial Law", "Legal Consultancy", "Commercial Drafting & Vetting", "Banking & Financial Legal Affairs", "Mediation & ADR", "Advocacy Training"],
    "experience": { "years": "30+ Years", "label": "Legal Practice, Corporate Advisory & ADR Training" },
    "accreditations": ["CEDR Accredited Mediator", "CEDR Master Trainer", "Accredited Advocacy Trainer – IATC (Bar Council of England & Wales)", "PMA Accredited Mediator"],
    "education": ["Punjab Law College – Gold Medalist (Twice Awarded for Academic Merit)"],
    "affiliations": ["Pakistan Mediators Association", "Inns of Court Advocacy Training Programme Pakistan", "Punjab Bar Associations", "HBL – Legal Head North"]
  },
  "umaimah_anwar_khan": {
    "name": "Umaimah Anwar Khan",
    "role": "Executive Committee – South",
    "highlight": "",
    "about": "",
    "badges": ["Code of Conduct", "Bar Coordination – South"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "mustansir_zakir": {
    "name": "Mustansir Zakir",
    "role": "Executive Committee – South",
    "highlight": "\"Leading corporate governance and mediation training initiatives through strategic leadership and ADR excellence.\"",
    "about": "Mr. Mustansir Zakir is a senior corporate executive, Accredited Mediator, and Master Trainer with extensive leadership experience in corporate governance, hospitality, finance, and Alternative Dispute Resolution (ADR). Currently serving as Chief Executive at Hashoo Group, he has played a significant role in advancing mediation awareness and professional training initiatives in Pakistan through his leadership within the Pakistan Mediators Association (PMA).",
    "badges": ["Executive Team", "Mediator", "CEDR Accredited Mediator", "Director Training", "Master Trainer", "Ex-President"],
    "expertise": ["Corporate Governance", "Strategic Management", "Mediation & ADR Training", "Hospitality & Business Leadership", "Financial Management", "Institutional Development"],
    "experience": { "years": "30+ Years", "label": "Corporate Leadership, Governance & ADR" },
    "accreditations": ["CEDR Accredited Mediator", "CEDR Master Trainer", "Certified Director Education – PICG", "Strategic Management Certification – Cornell University, USA"],
    "education": ["Fellow – Institute of Chartered Accountants of Pakistan (ICAP)", "Fellow – Institute of Cost & Management Accountants of Pakistan (ICMAP)", "Fellow – Institute of Corporate Secretaries of Pakistan (ICSP)"],
    "affiliations": ["Pakistan Mediators Association (Ex-President & Director Training)", "Hashoo Group – Chief Executive", "Pakistan Hotels Association (Former Chairman)", "Association of Builders & Developers of Pakistan (ABAD)", "Karachi Sea Scout Council Trust – Managing Trustee"]
  },
  "usman_g_rashid": {
    "name": "Usman G. Rashid",
    "role": "Member",
    "highlight": "\"Combining legal advocacy, mediation expertise, and training leadership to build ADR capacity across Pakistan.\"",
    "about": "Usman G. Rashid is a Barrister-at-Law, Advocate of the High Courts, CEDR Accredited Mediator, and Master Trainer with extensive experience in legal practice, advocacy training, mediation, and legal education. He holds an LL.B. (Hons.) from the University of London, an LL.M. from King's College London, and completed the Bar Vocational Course from the University of the West of England, Bristol, U.K. He was called to the Bar by the Hon'ble Society of Lincoln's Inn.\n\nHe previously served as Secretary General of the Pakistan Mediators Association (PMA) and has actively contributed to mediation awareness, ADR capacity building, and professional legal training initiatives in Pakistan. Alongside his legal practice, he is engaged in legal education and advocacy training, particularly in Company Law and Law of Evidence for the University of London External Programme.\n\nUsman began his professional career with Umar Bandial & Associates and currently manages his legal practice through Inayatullah Chambers, Advocates & Legal Consultants. His combined expertise in litigation, ADR, legal education, and advocacy training enables him to contribute effectively toward institutional ADR development and professional mediation practices.",
    "badges": ["Mediator", "Master Trainer", "Barrister-at-Law"],
    "expertise": ["ADR & Mediation Training", "Advocacy Skills Training", "Company Law", "Law of Evidence", "Commercial & Civil Litigation", "Legal Education & Professional Development", "Conflict Resolution"],
    "experience": { "years": "", "label": "CEDR Accredited Mediator & Master Trainer" },
    "accreditations": ["CEDR Accredited Mediator & Master Trainer – UK", "Barrister-at-Law – Lincoln's Inn", "Certified Advocacy Trainer"],
    "education": ["LL.M. – King's College, University of London", "LL.B. (Hons.) – University of London", "Bar Vocational Course – University of the West of England, Bristol, U.K."],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Hon'ble Society of Lincoln's Inn", "University College Lahore", "University of London External Programme", "Inayatullah Chambers, Advocates & Legal Consultants"]
  },
  "adnan_mufti": {
    "name": "Adnan Mufti",
    "role": "Executive Committee – South",
    "highlight": "",
    "about": "",
    "badges": ["Institutional Coordination", "Leadership"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "anwar_kashif_mumtaz": {
    "name": "Anwar Kashif Mumtaz",
    "role": "Master Trainer",
    "highlight": "",
    "about": "Anwar Kashif Mumtaz is a senior legal professional, leadership trainer, and accredited mediator with extensive experience in corporate, tax, and dispute resolution practice. As an Advocate of the High Court and Senior Partner at M/s. Saiduddin & Co., he has built a strong reputation in tax and corporate law advisory in Pakistan.\n\nHe is an internationally certified trainer in Leadership & Personal Development and a CEDR UK Accredited Mediator & Master Trainer. He has contributed significantly to leadership development, mediation awareness, and professional capacity building within legal and corporate sectors. He has also held prominent leadership positions including Secretary General, Vice President, and President of Pakistan Tax Bar and Karachi Tax Bar.",
    "badges": ["Master Trainer", "Ex-President", "Leadership Trainer"],
    "expertise": ["Leadership & Personal Development", "ADR & Mediation Training", "Corporate Law", "Tax Law & Advisory", "Professional Development Programs", "Conflict Resolution", "Train the Trainer (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["CEDR UK Accredited Mediator", "CEDR UK Master Trainer", "Certified International Trainer – Leadership & Personal Development"],
    "education": ["Advocate, High Court of Pakistan"],
    "affiliations": ["Pakistan Mediators Association (PMA)", "CEDR UK", "Pakistan Tax Bar", "Karachi Tax Bar", "Public Interest Law Association of Pakistan (PILAP)", "M/s. Saiduddin & Co."]
  }
          },
          "members": {
            "member_1": {
              "name": "Aga Zafar Ahmed",
              "title": "President",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Aga Zafar Ahmed"
            },
            "member_2": {
              "name": "Saima Amin Khawaja",
              "title": "Vice President – North",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Saima Amin Khawaja"
            },
            "member_3": {
              "name": "Asfand Yar Ali Khan",
              "title": "Vice President – North",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Asfand Yar Ali Khan"
            },
            "member_4": {
              "name": "Saeed Habib",
              "title": "Vice President – South",
              "badges": {
                "executive_team": "Executive Team"
              },
              "aria_label": "View profile of Saeed Habib"
            },
            "member_5": {
              "name": "Shabana Ali",
              "title": "Vice President – South",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "pma_accredited": "PMA Accredited Mediator"
              },
              "aria_label": "View profile of Shabana Ali"
            },
            "member_6": {
              "name": "Wajiha Aleem",
              "title": "Secretary General",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Wajiha Aleem"
            },
            "member_7": {
              "name": "Syed Sammad-ul-Haque",
              "title": "Finance Secretary",
              "badges": {
                "executive_team": "Executive Team"
              },
              "aria_label": "View profile of Syed Sammad-ul-Haque"
            },
            "member_8": {
              "name": "Tariq Saeed Rana",
              "title": "Executive Committee – North",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Tariq Saeed Rana"
            },
            "member_9": {
              "name": "Huma Shah",
              "title": "Executive Committee – North",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Huma Shah"
            },
            "member_10": {
              "name": "Umaimah Anwar Khan",
              "title": "Executive Committee – South",
              "badges": {
                "executive_team": "Executive Team"
              },
              "aria_label": "View profile of Umaimah Anwar Khan"
            },
            "member_11": {
              "name": "Mustansir Zakir",
              "title": "Executive Committee – South",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Mustansir Zakir"
            },
            "member_12": {
              "name": "Adnan Mufti",
              "title": "Executive Committee – South",
              "badges": {
                "executive_team": "Executive Team",
                "mediator": "Mediator",
                "cedr_accredited": "CEDR Accredited Mediator"
              },
              "aria_label": "View profile of Adnan Mufti"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "Mustansir Zakir",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "director_training": "Director Training",
                "ex_president": "Ex-President"
              },
              "aria_label": "View profile of Mustansir Zakir"
            },
            "trainer_2": {
              "name": "Anwar Kashif Mumtaz",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "ex_president": "Ex-President",
                "leadership_trainer": "Leadership Trainer"
              },
              "aria_label": "View profile of Anwar Kashif Mumtaz"
            },
            "trainer_3": {
              "name": "Tariq Saeed Rana",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "ex_president": "Ex-President",
                "executive_committee_north": "Executive Committee – North"
              },
              "aria_label": "View profile of Tariq Saeed Rana"
            },
            "trainer_4": {
              "name": "Saima Amin Khawaja",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "executive_member": "Executive Member",
                "vice_president_north": "Vice President – North"
              },
              "aria_label": "View profile of Saima Amin Khawaja"
            },
            "trainer_5": {
              "name": "Huma Shah",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "executive_committee_north": "Executive Committee – North",
                "training_committee": "Training Committee"
              },
              "aria_label": "View profile of Huma Shah"
            },
            "trainer_6": {
              "name": "Usman G. Rashid",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "barrister_at_law": "Barrister-at-Law",
                "former_secretary_general": "Former Secretary General – PMA"
              },
              "aria_label": "View profile of Usman G. Rashid"
            },
            "trainer_7": {
              "name": "Asfand Yar Ali Khan",
              "title": "Master Trainer",
              "badges": {
                "master_trainer": "Master Trainer",
                "executive_leadership": "Executive Leadership",
                "vice_president_north": "Vice President – North"
              },
              "aria_label": "View profile of Asfand Yar Ali Khan"
            }
          },
          "former_presidents": {
            "president_1": {
              "name": "Anwar Kashif Mumtaz",
              "title": "Former President"
            },
            "president_2": {
              "name": "Mustansir Zakir",
              "title": "Former President"
            },
            "president_3": {
              "name": "Tariq Saeed Rana",
              "title": "Former President"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "Sub Committee",
              "subtitle": "Our sub committees drive key initiatives and support PMA's mission through expertise, collaboration and dedicated service.",
              "expand_all": "Expand All"
            },
            "labels": {
              "mandate": "Mandate:",
              "director": "Director",
              "convener": "Convener"
            },
            "committees": {
              "training": {
                "title": "Training Committee",
                "mandate": "Orientation, Training, Certification/Accreditation/Refresher courses/Train the Trainer (TOT)",
                "lead_name": "Mustansir Zakir",
                "members": [
                  "Anwar Kashif Mumtaz",
                  "Saima Khawaja",
                  "Tariq Rana",
                  "Huma Shah",
                  "Asfandyar Ali Khan"
                ]
              },
              "conduct": {
                "title": "Code of Conduct Committee",
                "mandate": "Drafting a code of conduct for Mediators and lobbing to get it approved from Law Ministry for its implementation across the Country",
                "lead_name": "Umaima Khan",
                "members": [
                  "Anwar Kashif Mumtaz",
                  "Saima Khawaja",
                  "Khalid Mehmood",
                  "Adnan Mufti",
                  "Tariq Rana",
                  "Asfandyar Ali Khan"
                ]
              },
              "membership": {
                "title": "Membership Committee",
                "mandate": "Retention and activation of old membership, expansion of membership portfolio by inviting the Accredited Mediators of other institutes and also having associate members and honorary members as well.",
                "lead_name": "Saeed Habib",
                "members": [
                  "Khalid Mehmood",
                  "Saima Khawaja",
                  "Samad Ul Haq",
                  "Asfandyar Ali Khan"
                ]
              },
              "bar_south": {
                "title": "Legal & Academic Coordination – South",
                "mandate": "Coordination with Bar Association/Bar Council and Law Schools for organizing meetings, seminars, orientations and training/workshops",
                "lead_name": "Shabana Ali",
                "members": [
                  "Saadat Yar Khan",
                  "Umaima Khan",
                  "Mrs. Khalid Mehmood",
                  "Samad Ul Haq",
                  "Mansoor Meer",
                  "Naved Ahmed"
                ]
              },
              "bar_north": {
                "title": "Legal & Academic Coordination – North",
                "mandate": "Coordination with Bar Association/Bar Council and Law Schools for organizing meetings, seminars, orientations and training/workshops",
                "lead_name": "Saima Khawaja",
                "members": [
                  "Zafar Kalanauri",
                  "Barrister Tariq Rana",
                  "Asfandyar Ali Khan"
                ]
              },
              "institutional": {
                "title": "Institutional Coordination Committee",
                "mandate": "Coordination with Chambers, Trade bodies, Professional Associations/Institutes",
                "lead_name": "Adnan Mufti",
                "members": [
                  "Mustansir Zakir",
                  "Saeed Habib",
                  "Tariq Rana",
                  "Asfandyar Ali Khan",
                  "Samad Ul Haq"
                ]
              }
            },
            "footer_note": "Aga Zafar Ahmed (President) and Wajiha Aleem (Secretary General) are Ex. Officio member of every committee."
          },
          "mediators": {
            "adnan-mufti": { "name": "Adnan Mufti", "role": "Member" },
            "anwar-kashif-mumtaz": { "name": "Anwar Kashif Mumtaz", "role": "Member" },
            "ayesha-sarfraz-ali-khan": { "name": "Ayesha Sarfraz Ali Khan", "role": "Member" },
            "barrister-tariq-saeed-lahore": { "name": "Barrister Tariq Saeed", "role": "Member" },
            "farrukh-junaidy": { "name": "Farrukh Junaidy", "role": "Member" },
            "huma-shah": { "name": "Huma Shah", "role": "Member" },
            "ishtiaq-memon": { "name": "Ishtiaq Memon", "role": "Member" },
            "isfandyar-ali-khan": { "name": "Isfandyar Ali Khan", "role": "Member" },
            "khalid-firoz-arfeen": { "name": "Khalid Firoz Arfeen", "role": "Member" },
            "khalid-mahmood-siddiqui": { "name": "Khalid Mahmood Siddiqui", "role": "Member" },
            "mohammad-rehan-siddqui": { "name": "Mohammad Rehan Siddqui", "role": "Member" },
            "mustansir-zakir": { "name": "Mustansir Zakir", "role": "Member" },
            "nausheen-ahmed": { "name": "Nausheen Ahmed", "role": "Member" },
            "neelofar-hameed": { "name": "Neelofar Hameed", "role": "Member" },
            "omair-nisar-khan": { "name": "Omair Nisar Khan", "role": "Member" },
            "raheem-hasnani": { "name": "Raheem Hasnani", "role": "Member" },
            "reshma-aftab": { "name": "Reshma Aftab", "role": "Member" },
            "rubina-virani": { "name": "Rubina Virani", "role": "Member" },
            "saadat-yar-khan": { "name": "Saadat Yar Khan", "role": "Member" },
            "saeed-habib": { "name": "Saeed Habib", "role": "Member" },
            "saima-khawaja": { "name": "Saima Amin Khawaja", "role": "Member" },
            "salina-khalfan": { "name": "Salina Khalfan", "role": "Member" },
            "shabana-ali": { "name": "Shabana Ali", "role": "Member" },
            "shaheen-premani": { "name": "Shaheen Premani", "role": "Member" },
            "syed-haider-imam-rizvi": { "name": "Syed Haider Imam Rizvi", "role": "Member" },
            "syed-sammadul-haque": { "name": "Syed Sammadul Haque", "role": "Member" },
            "tahmasp-r-razvi": { "name": "Tahmasp R. Razvi", "role": "Member" },
            "umaimah-a-rizvi": { "name": "Umaimah A. Rizvi", "role": "Member" },
            "usman-g-rashid": { "name": "Usman G. Rashid", "role": "Member" },
            "wajiha-aleem": { "name": "Wajiha Aleem", "role": "Member" },
            "yousuf-moulvi": { "name": "Yousuf Moulvi", "role": "Member" },
            "zafar-kalanauri": { "name": "Zafar Kalanauri", "role": "Member" },
            "zia-makhdoom": { "name": "Zia Makhdoom", "role": "Member" }
          }
        },
        "resources_page": {
          "hero": {
            "image_alt": "Services Hero",
            "eyebrow": "RESOURCES",
            "title_line1": "Knowledge. Law.",
            "title_accent": "Reform.",
            "lead_text": "Access PMA publications, mediation laws, institutional documents, research papers, advocacy resources, and media content that support the growth of ADR and peaceful dispute resolution in Pakistan."
          },
          "tabs": {
            "featured": "Featured",
            "downloads": "Downloads",
            "mediation_laws": "Mediation Laws",
            "advocacy": "Advocacy",
            "press_media": "Press & Media",
            "articles": "Articles"
          },
          "downloads_panel": {
            "header": {
              "title": "Downloads",
              "lead": "Downloadable PDFs, forms and publications. Click a file to open it in a new tab.",
              "view_all_text": "View All Downloads"
            },
            "global_labels": {
              "download_btn_text": "Download PDF",
              "default_image_alt": "ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "ADR-ACT-2017",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "Advocacy and Lobby",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "Certificate of Registration",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "Membership Application Form",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "Memorandum of Association Updated",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "Nomination",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "PMA Speech",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "Why Join PMA",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "Mediation Laws & Legislation",
              "lead": "Key statutes, bills and official legislation documents related to mediation.",
              "view_all_text": "View All Laws"
            },
            "global_labels": {
              "download_btn_text": "Download PDF",
              "default_image_alt": "ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "Islamabad Dispute Resolution Act (Mediation)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "Amendments in First Schedule of the Code of Civil Procedure, 1908",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "Punjab Amendments in Code of Civil Procedure, 1908 (Mediation Provisions)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "Draft Code of Civil Procedure (Sindh Amendment) Bill, 2018",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "Singapore Convention on Mediated Settlements (Text)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "Advocacy & Policy",
              "lead": "Policy briefs, advocacy toolkits and position papers to support ADR reform.",
              "view_all_text": "View All Advocacy"
            },
            "global_labels": {
              "download_btn_text": "Download PDF",
              "default_image_alt": "ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "KPK",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "Punjab",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "Sindh",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "Press & Media",
              "lead": "Press releases, media kits and downloadable assets for journalists.",
              "view_all_text": "View Media Assets"
            },
            "global_labels": {
              "download_btn_text": "Download PDF",
              "default_image_alt": "ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "Business Recorder",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "Business Recorder AD",
                "file_name": ""
              },
              "card_3": {
                "title": "Frontier Post",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "Pakistan Observer",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "PMA Press Release",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "Tribune",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "Articles & Analysis",
              "lead": "Research articles, analysis and thought leadership on mediation and ADR.",
              "view_all_text": "View All Articles"
            },
            "global_labels": {
              "download_btn_text": "Download PDF",
              "author_prefix": "By"
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "Jawad A. Sarwana",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "It Really Happened in Frankfurt PDF"
              },
              "card_2": {
                "title": "Mediation Techniques",
                "author": "Jawad A. Sarwana",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "Mediation Techniques PDF"
              }
            }
          },
          "search_bar": {
            "question": "Can't find what you're looking for?",
            "subtext": "Use search or browse by category to quickly find the resources you need.",
            "placeholder": "Search resources...",
            "browse_btn_text": "Browse All Resources"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "Events",
            "title": "Events",
            "lead": "Stay updated with PMA conferences, mediation initiatives, workshops, and important announcements.",
            "image_alt": "Events Hero"
          },
          "tab_bar": {
            "upcoming_events": "Upcoming Events",
            "past_events": "Past Events",
            "announcements": "Announcements"
          },
          "upcoming_panel": {
            "title": "Coming Soon",
            "lead": "Upcoming events, conferences, and workshops will be listed here. Check back soon."
          },
          "announcements_panel": {
            "title": "Coming Soon",
            "lead": "Important announcements will appear here. Stay tuned."
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "PAST EVENT",
                "pill_text": "Certified Training Program",
                "view_gallery_btn": "View Event Gallery",
                "about_label": "About the Event",
                "highlights_label": "KEY TRAINING HIGHLIGHTS"
              },
              "card": {
                "title": "6th Certified Mediation Training Program",
                "sub": "Sindh High Court",
                "date": "08 June 2026 To 12th June 2026",
                "location": "Sindh High Court, Karachi"
              },
              "about_paragraphs": [
                "Pakistan Mediators Association (PMA) successfully conducted the 6th Certified Mediation Training Program at Sindh High Court.",
                "The program focused on strengthening mediation skills, promoting alternative dispute resolution practices, and enhancing professional capacity among legal practitioners and mediation professionals.",
                "Through interactive sessions, practical exercises, and collaborative discussions, participants gained valuable insights into modern mediation techniques and dispute resolution frameworks."
              ],
              "highlights": [
                "Certified Mediation Training Sessions",
                "Practical Mediation Exercises",
                "Interactive Group Discussions",
                "Alternative Dispute Resolution Techniques",
                "Professional Capacity Building",
                "Collaborative Learning Environment"
              ],
              "meta": {
                "objective_label": "TRAINING OBJECTIVE",
                "objective_text": "To strengthen mediation skills and promote effective dispute resolution practices.",
                "organized_label": "ORGANIZED BY",
                "organized_text": "Pakistan Mediators Association (PMA)",
                "participants_label": "PARTICIPANTS",
                "participants_text": "Legal Professionals, ADR Practitioners, Mediators and Trainee Participants.",
                "type_label": "Event Type",
                "type_text": "Certified Training Program"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "Past Event",
                "about_label": "About the Event",
                "highlights_label": "Key ADR Developments Highlighted"
              },
              "card": {
                "title": "Mediation A Way Forward",
                "sub": "1st National Mediation Conference",
                "date": "7th March, 2015",
                "location": "Hotel Marriott, Karachi",
                "type": "National Conference"
              },
              "about_paragraphs": [
                "PMA is Pakistan's first organization representing foreign trained and accredited mediators as well as other professionals who have joined the Association to further the cause of the Association. The Association was formed in 2013 and has taken over number of activities which were earlier implemented by IFC/World Bank Group's Alternative Dispute Resolution (ADR) Project.",
                "Considering that Pakistan's contract enforcement indicators are not encouraging and it takes number of years and cost of contract enforcement, PMA resolves to lead and support interventions which will enable litigants and disputants to resolve disputes amicably and through mediation process and complement efforts of judiciary and courts in timely resolution of disputes."
              ],
              "highlights": [
                "Operationalization of Karachi Centre for Dispute Resolution in Karachi and Lahore Chamber of Commerce and Industry Mediation Centre in Lahore.",
                "Lobbying for ADR/mediation law reforms in Pakistan.",
                "Presence of CEDR Accredited Mediators and Master Trainers in Pakistan.",
                "ADR Curriculum Development in Pakistan.",
                "ADR trainings strengthened and delivered in Pakistan.",
                "ADR considered as means to settle multitude of disputes including corporate governance."
              ],
              "meta": {
                "objective_label": "Conference Objectives",
                "objective_text": "To further the cause of ADR and mediation and debate developments, challenges and future interventions for institutionalizing mediation in Pakistan.",
                "organized_label": "Conference Hosts",
                "organized_text": "This conference is hosted by Pakistan Mediators Association with support of conference partners.",
                "participants_label": "Speakers & Guests",
                "participants_text": "Representatives from Government, Judiciary, Business Community, Bar, Academia and Mediation Centers in Pakistan along with foreign speakers.",
                "type_label": "Event Type",
                "type_text": "National Conference"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "Privacy",
            "title_accent": "Policy",
            "lead_text": "We are committed to protecting your privacy and ensuring that your personal information is handled securely and responsibly."
          },
          "sections": {
            "commitment": {
              "title": "Privacy Commitment",
              "paragraphs": [
                "Pakistan Mediators Association (PMA) is committed to safeguarding your privacy online. Pakistan Mediators Association (PMA) has created this privacy statement in order to demonstrate our firm commitment to privacy. The following discloses our information gathering and dissemination practices for Pakistan Mediators Association (PMA).",
                "PMA reserves the right to change this policy at any time by notifying users of the existence of a new privacy statement. This statement and the policies outlined herein are not intended to and do not create any contractual or other legal rights in or on behalf of any party."
              ]
            },
            "respect_data": {
              "title": "Respect for User Data",
              "paragraphs": [
                "Pakistan Mediators Association (PMA) highly values the strong relationships we have with our customers. The collection of data at Pakistan Mediators Association (PMA) is being handled with full and proper respect for the privacy of our customers.",
                "The data we collect is handled sensitively, securely and with proper regard to privacy. Pakistan Mediators Association (PMA) does not disclose, distribute or sell the data we collect from our clients to third parties."
              ]
            },
            "collection": {
              "title": "Information Collection",
              "lead_text": "PMA collects information for membership signup such as:",
              "items": [
                "Computerized National Identity Card (CNIC)",
                "Complete Name",
                "Residential Address",
                "Office Address",
                "Phone Number",
                "Email Information",
                "Other related membership information"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "Complaint & Appeal",
            "title_accent": "Policy",
            "lead_text": "We are committed to addressing concerns fairly, promptly, and transparently."
          },
          "intro_card": {
            "bold_text": "We have a procedure for dealing with complaints that ensure they are given proper care and attention.",
            "lead_p": "Complaints can be made by any user of PMA's mediation accreditation services. PMA aims to provide a responsive and timely service to all users. We will:",
            "commitments": [
              "treat all complaints seriously and deal with them properly;",
              "address complaints promptly; and",
              "learn from complaints and take action to improve our service."
            ]
          },
          "steps": [
            {
              "text": "We can, however, only deal with complaints that raise concerns about poor customer service received by the Director of Training."
            },
            {
              "text": "This means your case must be addressed to the Director of Training and sent by post and email with cc to the President of PMA."
            },
            {
              "text": "A student who is dissatisfied with the decision of the Director of Training is free to reject the decision, in which case it will have no binding effect. The Director is bound to respond to the Complaint within 30 days of its receipt."
            },
            {
              "text": "If, however, you remain dissatisfied with the handling of your complaint or there is no response from the Director of Training, you may address your complaint to the President of PMA who will set up a two-member Faculty Tribunal to hear your grievance."
            },
            {
              "text": "You will need to be clear and concise about the reasons for your request and what you would like to achieve from the review or non-action by the Director of Training. The two-member Tribunal will write to you with copy to President of PMA and definitely respond to you in writing within 30 working days of the escalation request being made."
            },
            {
              "text": "If you are dissatisfied with the action or inaction on the part of the two-member Tribunal on your Complaint, the same will not affect any party's rights to access the Consumer Court for relief which options are open to all."
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "Terms and",
            "title_accent": "Conditions",
            "lead_text": "Please read these terms carefully. By accessing and using our website and services, you agree to comply with the following terms and conditions."
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "Training",
              "preview": "To confirm your booking, your payment must reach our offices in advance; before the start of the courses.",
              "body_paragraphs": [
                "If the user is late on payment, they will not be allowed to take the courses."
              ]
            },
            {
              "id": "refunds",
              "title": "Training Refunds",
              "preview": "We understand life can be complex. If you are no longer able to attend, please contact us as soon as possible on 021-3452-9768 or email us at info@pma.org.pk.",
              "body_paragraphs": [
                "We are happy to accommodate a substitute attendee in your place, or arrange a credit or refund and we will always consider your case on an individual basis."
              ]
            },
            {
              "id": "membership",
              "title": "Membership Cancellations",
              "preview": "Membership is non-refundable except in special circumstances.",
              "body_paragraphs": [
                "Please contact us if you believe your circumstances qualify for an exception. Each case is reviewed individually by the PMA membership committee."
              ]
            },
            {
              "id": "copyright",
              "title": "Copyright",
              "preview": "This site and its contents are subject to copyright. The site material copyright is owned by Pakistan Mediators Association (PMA), or in the case of some material, a third party. The site function and operation copyright is owned by PMA.",
              "body_paragraphs": [
                "You may view this site and its contents using your web browser and electronically copy and print hard copies of parts of this site solely for personal, non-commercial use. Any other use, including the reproduction, modification, distribution, transmission, republication, display or performance, of the content of this site is strictly prohibited."
              ]
            },
            {
              "id": "disclaimer",
              "title": "Disclaimer",
              "preview": "You agree that your access to, and use of, this site is subject to these terms and all applicable laws, and is at your own risk. This site and its contents are provided to you on \"as is\" basis, the site may contain errors, faults and inaccuracies and may not be complete and current.",
              "body_paragraphs": [
                "Pakistan Mediators Association (PMA) makes no representations or warranties of any kind, express or implied as to the operation of this site or the information, content, materials or products included on this site, except as otherwise provided under applicable laws.",
                "Neither PMA, nor its affiliates, directors, officers, employees, agents, contractors, successors or assigns will be liable for any damages whatsoever arising out of, or in any way related to, the use of this site and any other site linked to this site. This limitation applies to direct, indirect, consequential, special, punitive or other damages you or others may suffer, as well as damages for loss of profits, business interruption or the loss of data or information."
              ]
            },
            {
              "id": "translations",
              "title": "Google Translations",
              "preview": "This website has been translated for your convenience using a translation process powered by Google Translate™. Google Translate™ translations are done by an automated computer process, not a certified professional translator.",
              "body_paragraphs": [
                "For that reason, the translations may be inaccurate or unreliable. Use Google Translate™ translations with caution. The translations are provided \"as is\" without warranties of any kind. Some content (such as images, videos, Flash, etc.) may not be translated due to the limitations of the translation software.",
                "PMA is not responsible for incomplete or inaccurate translations, nor is it liable for any damages or losses arising out of the user’s use of Google Translate™ translations (or any other translations on this website).",
                "If you have any questions about Google™ Translate, visit: Google Translate™ FAQs.",
                "Google disclaims all warranties related to the translations, express or implied, including any warranties of accuracy, reliability, and any implied warranties of merchantability, fitness for a particular purpose and non-infringement."
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "Join PMA",
            "title_main": "Become a",
            "title_accent": "PMA Member",
            "lead_text": "Join a distinguished community of mediators, ADR professionals and institutional leaders committed to peaceful dispute resolution."
          },
          "why_join": {
            "title_main": "Why",
            "title_accent": "Join",
            "title_end": "PMA?",
            "subtitle": "PMA members enjoy a clear set of professional advantages and opportunities.",
            "cards": [
              {
                "title": "International Conferences",
                "description": "Attend global conferences on the latest issues in mediation & arbitration with discounted fees and priority registration."
              },
              {
                "title": "Workshops & Courses",
                "description": "Gain access to top quality educational workshops and professional development courses."
              },
              {
                "title": "Professional Growth",
                "description": "Increase your understanding of mediation and ADR through expert insights and resources."
              },
              {
                "title": "Global Network",
                "description": "Establish and maintain valuable national and international professional connections."
              },
              {
                "title": "Business Opportunities",
                "description": "Widen your circle of business and professional acquaintances."
              },
              {
                "title": "Support the Profession",
                "description": "Play a key role in the support and development of mediation and peaceful dispute resolution."
              }
            ]
          },
          "benefits": {
            "title_main": "Membership",
            "title_accent": "Benefits",
            "subtitle": "As a registered member of PMA, you will enjoy a wide range of advantages and opportunities.",
            "items": [
              {
                "title": "Networking Opportunities",
                "description": "Throughout the year, PMA provides various opportunities for members to enhance professional relationships and keep abreast of industry activities and trends."
              },
              {
                "title": "Membership Directory",
                "description": "Exclusively available for PMA members, this directory contains updated contact details of members and other global organizations. Available in print and electronic form."
              },
              {
                "title": "Membership Certificate",
                "description": "Members are issued a globally recognized membership certificate upon acceptance. Certificates are awarded at the Annual Members Gala."
              },
              {
                "title": "Continuous Professional Development",
                "description": "Priority access to exclusive workshops and professional development courses conducted by leading experts in mediation and ADR, in English and Arabic."
              }
            ]
          },
          "membership_journey": {
            "title": "Membership Journey",
            "subtitle": "A simple process to become a valued member of PMA.",
            "steps": [
              {
                "num": "1",
                "title": "Submit Membership Form",
                "desc": "Fill out the online application form."
              },
              {
                "num": "2",
                "title": "Profile Review",
                "desc": "Our team will review your application."
              },
              {
                "num": "3",
                "title": "Membership Approval",
                "desc": "You will be notified once your application is approved."
              },
              {
                "num": "4",
                "title": "Welcome to PMA",
                "desc": "Receive your membership certificate and become a part of our professional network."
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "Membership Application Form",
              "desc": "Please provide accurate information. All fields marked * are mandatory."
            },
            "sections": {
              "personal_info": {
                "title": "Personal Information",
                "fields": {
                  "full_name": { "label": "Full Name", "placeholder": "Enter your full name" },
                  "father_name": { "label": "Father Name", "placeholder": "Enter father name" },
                  "qualification": { "label": "Educational Qualification", "placeholder": "Enter qualification" },
                  "designation": { "label": "Designation", "placeholder": "Enter designation" },
                  "cnic": { "label": "CNIC", "placeholder": "Enter CNIC number" },
                  "chamber_phone": { "label": "Chamber Phone", "placeholder": "Enter chamber phone" }
                }
              },
              "contact_info": {
                "title": "Contact Information",
                "fields": {
                  "office_address": { "label": "Office Address", "placeholder": "Enter office address" },
                  "res_address": { "label": "Residential Address", "placeholder": "Enter residential address" },
                  "res_phone": { "label": "Residence Phone", "placeholder": "Enter residence phone" },
                  "email": { "label": "Email", "placeholder": "Enter email address" },
                  "upload": {
                    "label": "Upload Documents",
                    "text": "Choose File or drag file here",
                    "hint": "PDF, JPG, PNG (Max 5MB)"
                  }
                }
              },
              "references": {
                "title": "Professional References",
                "fields": {
                  "proposer_name": { "label": "Proposer Full Name", "placeholder": "Enter proposer full name" },
                  "proposer_address": { "label": "Proposer Residential Address", "placeholder": "Enter address" },
                  "proposer_phone": { "label": "Proposer Phone", "placeholder": "Enter phone number" },
                  "seconder_name": { "label": "Seconder Full Name", "placeholder": "Enter seconder full name" },
                  "seconder_address": { "label": "Seconder Residential Address", "placeholder": "Enter address" },
                  "seconder_phone": { "label": "Seconder Phone", "placeholder": "Enter phone number" }
                }
              }
            },
            "declaration": "I hereby declare that the information provided above is true and accurate.",
            "submit_btn": "Submit Application",
            "sidebar": {
              "title_main": "Be Part of",
              "title_accent": "Positive Change",
              "desc": "Join PMA and contribute to building a culture of dialogue, understanding, and peaceful dispute resolution.",
              "list": [
                "Professional Recognition",
                "Learning & Development",
                "Networking & Collaboration",
                "Impactful Contribution"
              ],
              "quote": "Together, we can create a more harmonious and just society through mediation.",
              "author": "- PMA"
            }
          }
        }
      }
    },
    ur: {
      translation: {
        nav: {
          home: "ہوم",
          about: "پی ایم اے کے بارے میں",
          mediation: "میڈیشن",
          services: "خدمات",
          training: "ٹریننگ",
          leadership: "لیڈرشپ",
          resources: "وسائل",
          events: "ایونٹس",
          contact: "رابطہ کریں",
          membership: "ممبر بنیں"
        },
        hero: {
          title_part1: "پرامن حل کو فروغ دینا",
          title_part2: "مکالمے، تفہیم اور احترام کے ذریعے",
          description1: "ہم روایتی قانونی چارہ جوئی کے متبادل کے طور پر میڈیشن کو ایک موثر، کفایت شعار، خفیہ اور باہمی تعاون کے ذریعہ فروغ دیتے ہیں۔",
          description2: "منظم مکالمے اور پیشہ ورانہ سہولت کاری کے ذریعے، ہم افراد، خاندانوں، کاروباروں اور اداروں کی تنازعات کو خوش اسلوبی سے حل کرنے میں مدد کرتے ہیں — جس سے تعلقات برقرار رہتے ہیں اور وقت، لاگت اور ذہنی دباؤ میں کم آتا ہے۔",
          btn_consult: "مفت مشاورت کی درخواست کریں",
          btn_training: "تربیتی پروگرام دیکھیں"
        },
        features: {
          confidential_title: "خفیہ اور نجی",
          confidential_desc: "آپ کی بات چیت مکمل طور پر محفوظ ہے۔",
          faster_title: "تیز تر حل",
          faster_desc: "تنازعات کو مہینوں کے بجائے دنوں یا ہفتوں میں حل کریں۔",
          cost_title: "کم خرچ حل",
          cost_desc: "مہنگی قانونی فیسوں اور لمبی عدالتی لڑائیوں سے بچیں۔"
        },
        glance: {
          title: "ایک نظر میں PMA",
          founded: "قیام 2013–14",
          founded_label: "پاکستان کی پہلی میڈیشن ایسوسی ایشن",
          mediations: "2000+",
          mediations_label: "کامیاب میڈیشن اور سہولت کاری کے کیسز",
          mediators: "100+",
          mediators_label: "پاکستان بھر میں تصدیق شدہ ثالث",
          training: "100+",
          training_label: "تربیتی پروگرامز",
          impact: "قومی اثر",
          impact_label: "ADR آگاہی اور پالیسی اصلاحات کو فروغ دینا"
        },
        about: {
          years: "سال",
          stat_label: "میڈیشن میں عمدگی کو فروغ دینا",
          tab1_title: "PMA کے بارے میں",
          tab1_text: "PMA (پاکستان میڈیٹرز ایسوسی ایشن) ایک خودمختار ادارہ ہے جو پاکستان بھر میں میڈیشن اور متبادل تنازعات کے حل (ADR) کے ذریعے پرامن حل کو فروغ دینے کے لیے قائم کیا گیا ہے۔ بین الاقوامی طور پر تسلیم شدہ ثالثوں اور ٹرینرز کے ساتھ، PMA میڈیشن کی آگاہی، پیشہ ورانہ تربیت، ادارہ جاتی ADR کی ترقی اور پالیسی سازی کے لیے سرگرم عمل ہے۔ ہمارا مشن ایسے قابل رسائی، خفیہ اور مؤثر تنازعات کے حل کے نظام بنانا ہے جو افراد، کاروبار، تنظیموں اور برادریوں کو تعلقات برقرار رکھتے ہوئے اور غیر ضروری قانونی چارہ جوئی کو کم کرتے ہوئے تنازعات کو حل کرنے میں مدد کرتے ہیں۔",
          tab2_title: "ہمارا وژن",
          tab2_text: "میڈیشن کو پاکستان میں تنازعات کے حل کے لیے معروف اور سب سے قابل اعتماد طریقہ بنانا، جس سے تعمیری مکالمے، باہمی مفاہمت اور پرامن بقائے باہمی کی ثقافت کو فروغ ملے۔",
          tab3_title: "ہمارا مشن",
          tab3_mission1: "میڈیشن کو ایک قابل رسائی اور مؤثر تنازعات کے حل کے طریقہ کار کے طور پر فروغ دینا",
          tab3_mission2: "بین الاقوامی معیارات کے مطابق ثالثوں کی تربیت اور منظوری دینا",
          tab3_mission3: "عدالتوں، سرکاری اداروں اور نجی شعبوں کے ساتھ تعاون کرنا",
          tab3_mission4: "معاشرے میں میڈیشن کے فوائد کے بارے میں آگاہی پیدا کرنا",
          tab4_title: "ہمارا اثر",
          tab4_text1: "PMA نے سینکڑوں وکلاء، ججوں اور پیشہ ور افراد کو کامیابی سے تربیت دی ہے اور پاکستان میں عدالت سے منسلک میڈیشن کے اقدامات کو فروغ دینے میں اہم کردار ادا کیا ہے۔",
          tab4_text2: "ہم میڈیشن کو تنازعات کے حل کے ایک پائیدار نظام کے طور پر مضبوط کرنے کے لیے عدلیہ اور اسٹیک ہولڈرز کے ساتھ مل کر کام کر رہے ہیں۔",
          info_phone_label: "ہماری خدمات درکار ہیں؟",
          info_phone_val: "کال کریں: +92 300 000 0000",
          info_hours_label: "کام کے اوقات",
          info_hours_val: "پیر تا جمعہ (9 بجے سے 5 بجے تک)",
          info_email_label: "ہمیں ای میل کریں",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "میڈیشن (مصالحت) کیا ہے؟",
          text1: "میڈیشن ایک رضاکارانہ، خفیہ اور منظم عمل ہے جہاں ایک غیر جانبدار ثالث فریقین کو بات چیت کرنے، ایک دوسرے کے نقطہ نظر کو سمجھنے اور باہمی طور پر قابل قبول حل تک پہنچنے میں مدد کرتا ہے۔",
          text2: "یہ فریقین کو نتائج طے کرنے کا اختیار دیتا ہے، تعلقات کو برقرار رکھتا ہے اور وقت، خرچ اور ذہنی دباؤ کو بچاتا ہے۔",
          btn: "میڈیشن کا عمل سمجھیں"
        },
        why_choose: {
          title: "آپ <span class='pma-about-heading-accent'>PMA</span> کا انتخاب کیوں کریں؟",
          lead: "ہم اخلاقی، مؤثر اور پائیدار ADR (متبادل تصفیہ تنازعات) کے حل فراہم کرنے کے لیے مقامی فہم و فراست کے ساتھ بین الاقوامی معیار کو یکجا کرتے ہیں۔",
          btn: "PMA کے بارے میں مزید جانیں",
          features: {
            f1_title: "بین الاقوامی معیار",
            f1_desc: "ہم عالمی سطح پر تسلیم شدہ مصالحت کے اصولوں اور طریقوں پر عمل کرتے ہیں۔",
            f2_title: "تجربہ کار اور تصدیق شدہ ثالث",
            f2_desc: "ہمارے پینل میں انتہائی تربیت یافتہ اور مستند پیشہ ور افراد شامل ہیں۔",
            f3_title: "خفیہ عمل",
            f3_desc: "ہر مرحلے پر آپ کی رازداری ہماری اولین ترجیح ہے۔",
            f4_title: "تیز رفتار اور دوستانہ نتائج",
            f4_desc: "ہم تنازعات کو مؤثر اور باکفایت طریقے سے حل کرنے میں مدد کرتے ہیں۔",
            f5_title: "لاگت میں بچت",
            f5_desc: "مہنگی اور طویل قانونی چارہ جوئی کا ایک عملی اور بہترین متبادل۔"
          }
        },
        training: {
          title_part1: "پیشہ ورانہ تربیت اور",
          title_part2: "توثیق (Accreditation)",
          text: "PMA بین الاقوامی سطح کے مطابق مصالحت کی تربیت اور پیشہ ورانہ ترقی کے پروگرام فراہم کرتا ہے جو وکلاء، کارپوریٹ پیشہ ور افراد، HR ٹیموں، اساتذہ، اور ابھرتے ہوئے ثالثین کے لیے تیار کیے گئے ہیں۔ ہمارے ورکشاپس اور سرٹیفیکیشن پروگرامز تنازعات کے عملی حل کی مہارتوں، گفت و شنید کی حکمت عملیوں، باہمی رابطے اور ADR کے فریم ورکس پر توجہ مرکوز کرتے ہیں۔",
          features: {
            feat1: "IMI توثیق (Accreditation)",
            feat2: "ماہر ٹرینرز",
            feat3: "عملی سیکھنے کا عمل",
            feat4: "عالمی معیار"
          },
          card_text: "ہمارے تربیتی پروگرام بین الاقوامی معیارات پر پورا اترتے ہیں اور پیشہ ور افراد کو مؤثر، اخلاقی، اور عالمی سطح پر قابل ثالث بننے کے لیے بااختیار بناتے ہیں۔",
          btn_text: "تربیتی پروگرامز دریافت کریں"
        },
        services: {
          title: "ہماری بنیادی خدمات",
          list: {
            s1: { title: "کمرشل اور کارپوریٹ میڈیشن", desc: "کاروباری اور تجارتی تنازعات کا مؤثر حل۔" },
            s2: { title: "عدالتی میڈیشن", desc: "عدالت سے منسلک معاملات کے لیے ADR سپورٹ۔" },
            s3: { title: "خاندانی اور کمیونٹی میڈیشن", desc: "خاندانی تنازعات کا پرامن حل۔" },
            s4: { title: "کام کی جگہ کے تنازعات", desc: "دفتر کے اندرونی تنازعات کو حل کرنا۔" },
            s5: { title: "IMI-تصدیق شدہ ثالث ٹریننگ", desc: "پیشہ ورانہ ثالث سرٹیفیکیشن پروگرام۔" },
            s6: { title: "ورکشاپس اور آگاہی", desc: "ADR آگاہی پیدا کرنے والے تعلیمی سیشن۔" },
            s7: { title: "ادارہ جاتی مشاورتی خدمات", desc: "ADR سسٹمز بنانے میں اداروں کی معاونت۔" }
          }
        },
        leadership: {
          title: "ہماری قیادت سے ملیں",
          roles: {
            president: "صدر", secretary: "سیکرٹری جنرل", vp_north: "نائب صدر - شمال", ec_north: "ایگزیکٹو کمیٹی - شمال"
          }
        },
        stats: {
          s1: { label: "کامیاب میڈیشنز", unit: "+" },
          s2: { label: "کامیاب حل", unit: "%" },
          s3: { label: "100% نجی عمل", value: "خفیہ" },
          s4: { label: "تربیت یافتہ ثالث", value: "مستند" }
        },
        partners: {
          title: "ہمارے پارٹنرز",
          p1: "سندھ ہائی کورٹ",
          p2: "سرکاری ادارے",
          p3: "انٹرنیشنل میڈیشن انسٹی ٹیوٹ"
        },
        cta: {
          title: "آئیں بات کریں، کیونکہ ہم کر سکتے ہیں۔",
          subtitle: "کیا آپ تنازعہ پرامن طریقے سے حل کرنا چاہتے ہیں؟ یا مصدقہ ثالث بننا چاہتے ہیں؟ آج ہی رابطہ کریں",
          btn1: "مفت مشاورت",
          btn2: "مصدقہ ثالث بنیں",
          link: "ہماری ٹیم سے فوری چیٹ کریں"
        },
        footer: {
          brand: {
            tagline: "پاکستان بھر میں مکالمے، مصالحت اور باہمی افہام و تفہیم کے ذریعے پرامن حل کو فروغ دینا۔",
            logo_alt: "پاکستان میڈیٹرز ایسوسی ایشن"
          },
          quick_links: {
            title: "فوری لنکس",
            items: [
              { label: "گھر", link: "index.html" },
              { label: "PMA کے بارے میں", link: "about.html" },
              { label: "میڈیشن (مصالحت)", link: "mediation.html" },
              { label: "خدمات", link: "services.html" },
              { label: "تربیت", link: "training.html" },
              { label: "قیادت", link: "leadership.html" },
              { label: "وسائل", link: "resources.html" },
              { label: "ایونٹس", link: "events.html" },
              { label: "رابطہ کریں", link: "contact.html" }
            ]
          },
          services: {
            title: "ہماری خدمات",
            items: [
              "میڈیشن کی خدمات",
              "IMI سے تصدیق شدہ میڈیٹر ٹریننگ",
              "ADR ورکشاپس اور آگاہی سیشن",
              "ادارہ جاتی ADR مشاورتی خدمات",
              "پالیسی اور میڈیشن ایڈوکیسی"
            ]
          },
          contact: {
            title: "رابطہ کی معلومات",
            hours: "پیر تا جمعہ (صبح 9 بجے سے شام 5 بجے تک)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 پاکستان میڈیٹرز ایسوسی ایشن (PMA)۔ جملہ حقوق محفوظ ہیں۔",
            legal: [
              { label: "اکثر پوچھے گئے سوالات (FAQ's)", link: "faq.html" },
              { label: "پرائیویسی پالیسی", link: "privacy-policy.html" },
              { label: "شکایت اور اپیل پالیسی", link: "complaint-policy.html" },
              { label: "شرائط و ضوابط", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "PMA کے بارے میں",
            eyebrow: "PMA بابت",
            title_part1: "ایک ایسی ثقافت کی تعمیر",
            title_part2: "مکالمہ، تصفیہ اور باہمی افہام و تفہیم کے ذریعے",
            lead: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) پیشہ ورانہ تربیت، ادارہ جاتی تعاون، اور بین الاقوامی سطح پر تسلیم شدہ معیارات کے ذریعے پورے پاکستان میں میڈیشن (مصالحت) اور متبادل تنازعات کے حل (ADR) کو فروغ دینے کے لیے پرعزم ہے۔"
          },
          about: {
            hero_img_alt: "PMA کے بارے میں",
            hero_eyebrow: "PMA بابت",
            hero_title_part1: "ایک ایسی ثقافت کی تعمیر",
            hero_title_part2: "مکالمہ، تصفیہ اور باہمی افہام و تفہیم کے ذریعے",
            hero_lead: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) پیشہ ورانہ تربیت، ادارہ جاتی تعاون، اور بین الاقوامی سطح پر تسلیم شدہ معیارات کے ذریعے پورے پاکستان میں میڈیشن (مصالحت) اور متبادل تنازعات کے حل (ADR) کو فروغ دینے کے لیے پرعزم ہے۔",
            badge_years: "سال",
            badge_stat_label: "مصالحتی مہارت کا <br>فروغ",
            nav_tab1: "PMA کے بارے میں",
            nav_tab2: "ہمارا وژن",
            nav_tab3: "ہمارا مشن",
            nav_tab4: "ہمارا اثر",
            tab1_title1: "PMA کے",
            tab1_title2: "بارے میں",
            tab1_text: "PMA 2013 میں قائم ہوئی اور حکومت پاکستان کے ساتھ رجسٹرڈ ہے، PMA وہ پیشہ ورانہ ادارہ ہے جسے سینٹر فار ایفیکٹیو ڈسپیوٹ ریزولوشن (CEDR)، برطانیہ نے پاکستان میں CEDR ماڈل کی مصالحتی تربیت فراہم کرنے کا اختیار دیا ہے۔<br><br>PMA نے تھائی لینڈ آربیٹریشن سینٹر (2018) کے ساتھ مفاہمت کی ایک یادداشت پر دستخط کیے ہیں اور دیگر سارک ممالک کے اداروں کے ساتھ مضبوط تعلقات برقرار رکھے ہوئے ہے۔<br><br>ہماری ایسوسی ایشن بین الاقوامی سطح پر تسلیم شدہ CEDR سے تربیت یافتہ ماسٹر ٹرینرز اور مصالحت کاروں پر مشتمل ہے جنہوں نے سندھ، پنجاب اور اسلام آباد میں ججوں اور وکلاء کے لیے متعدد تربیتی پروگرام کامیابی کے ساتھ منعقد کیے ہیں، جس سے ملک میں مصالحت کے پیشہ ورانہ معیار بلند ہوئے ہیں۔",
            tab2_title1: "ہمارا",
            tab2_title2: "وژن",
            tab2_text: "پاکستان میں تنازعات کے حل کے سب سے نمایاں اور قابل اعتماد طریقے کے طور پر مصالحت (Mediation) کو قائم کرنا، تعمیری مکالمے، باہمی افہام و تفہیم اور پرامن بقائے باہمی کی ثقافت کو فروغ دینا۔",
            tab3_title1: "ہمارا",
            tab3_title2: "مشن",
            tab3_points: [
              "مصالحت کو تنازعات کے حل کے ایک آسان اور مؤثر طریقہ کار کے طور پر فروغ دینا",
              "بین الاقوامی معیارات کے مطابق مصالحت کاروں (Mediators) کو تربیت دینا اور ان کی تصدیق کرنا",
              "عدالتوں، حکومتی اداروں اور نجی شعبوں کے ساتھ تعاون کرنا",
              "پورے معاشرے میں مصالحت کے فوائد کے بارے میں آگاہی پیدا کرنا"
            ],
            tab4_title1: "ہمارا",
            tab4_title2: "اثر",
            tab4_text1: "PMA نے سینکڑوں وکلاء، ججوں اور پیشہ ور افراد کو کامیابی کے ساتھ تربیت دی ہے اور پاکستان میں عدالتوں سے منسلک مصالحتی اقدامات کو فروغ دینے میں کلیدی کردار ادا کیا ہے۔",
            tab4_text2: "ہم مصالحت کو ایک پائیدار تنازعات کے حل کے نظام کے طور پر مضبوط بنانے کے لیے عدلیہ اور اسٹیک ہولڈرز کے ساتھ مل کر کام جاری رکھے ہوئے ہیں۔"
          },
          leadership: {
            title1: "قیادت کے",
            title2: "پیغامات",
            president: {
              name: "آغا ظفر احمد",
              role1: "ایڈووکیٹ سپریم کورٹ آف پاکستان",
              role2: "صدر",
              role3: "پاکستان میڈیٹرز ایسوسی ایشن",
              heading: "صدر کا پیغام",
              quote: "مصالحت (میڈیشن) صرف ایک پیشہ ورانہ ذریعہ نہیں، بلکہ ترقی پذیر قانونی نظام کے لیے ایک ناگزیر ضرورت ہے۔",
              lead: "جیسے جیسے قانونی اور تجارتی منظر نامہ تبدیل ہو رہا ہے، فوری، منصفانہ اور مؤثر انصاف کی فراہمی کے لیے اے ڈی آر (ADR) کا کردار پہلے سے کہیں زیادہ اہم ہو گیا ہے۔ بطور صدر میری توجہ اپنے دائرہ کار کو وسعت دینے پر ہے، تاکہ مصالحت ہمارے قانونی منظر نامے کا ایک بنیادی ستون بن سکے۔",
              read_more: "مکمل پیغام پڑھیں",
              sign_role: "ایڈووکیٹ سپریم کورٹ آف پاکستان<br>صدر، پاکستان میڈیٹرز ایسوسی ایشن",
              popup: {
                p1: "پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے صدر کی حیثیت سے خدمات انجام دینا میرے لیے انتہائی اعزاز کی بات ہے۔ جیسے جیسے قانونی اور تجارتی منظر نامہ تبدیل ہو رہا ہے، فوری، منصفانہ اور مؤثر انصاف کو یقینی بنانے میں متبادل تنازعات کے حل (ADR) کا کردار کبھی اتنا اہم نہیں رہا۔",
                p2: "اس ایسوسی ایشن کے بانی رکن کے طور پر میرا سفر اس یقین کے ساتھ شروع ہوا کہ مصالحت صرف ایک پیشہ ورانہ ذریعہ نہیں بلکہ ترقی پذیر قانونی نظام کے لیے ایک ناگزیر ضرورت ہے۔ جیسے ہی ہم مستقبل کی طرف دیکھتے ہیں، میرا عزم ہے کہ ہم اپنی ایسوسی ایشن کو ایک زیادہ متحرک اور باہمی تعاون کا پلیٹ فارم بنائیں، جو روایتی قانونی چارہ جوئی اور جدید تنازعات کے حل کے درمیان خلیج کو پاٹ سکے۔",
                p3: "اپنے قیام کے بعد سے، پی ایم اے پاکستان بھر میں مصالحت کے عمل کو فروغ دینے اور اسے منظم کرنے کے لیے وقف ہے۔ ہم پیشہ ورانہ رویے کے اعلیٰ ترین معیار کو برقرار رکھنے اور ملک بھر میں مصالحت کاروں کے لیے ایک متحدہ آواز فراہم کرنے کی کوشش کرتے ہیں۔ بطور صدر میری توجہ اپنے دائرہ کار کو وسعت دینے پر ہے، تاکہ یہ بات یقینی بنائی جا سکے کہ مصالحت ہمارے قانونی منظر نامے کا ایک بنیادی ستون بن جائے، جسے عدلیہ اور عوام دونوں سماجی اور اقتصادی ہم آہنگی کے لیے ایک اہم ذریعے کے طور پر تسلیم کریں۔",
                commit_heading: "ہم مندرجہ ذیل کے لیے پرعزم ہیں:",
                commit_list: [
                  "<strong>صلاحیتوں کی تعمیر اور پیشہ ورانہ ترقی:</strong> مصالحت کاروں کے لیے اعلیٰ معیار کی تربیت اور منظوری کی سہولت فراہم کرنا جاری رکھنا تاکہ عالمی معیار کے طریقوں کو یقینی بنایا جا سکے اور ہمارے اراکین کی مہارتیں صنعت میں سب سے آگے رہیں۔",
                  "<strong>وکالت و تائید:</strong> مصالحت کو مرکزی دھارے کے قانونی فریم ورک میں ضم کرنے کے لیے شراکت داروں اور عدلیہ کے ساتھ مل کر کام کرنا۔",
                  "<strong>جدت طرازی:</strong> تجارتی، بحری اور کاروباری تنازعات کو مؤثر طریقے سے حل کرنے کے لیے جدید تکنیکوں اور عالمی بہترین طریقوں کو اپنانا۔",
                  "<strong>قومی کنونشنز:</strong> ہم ملک بھر میں تجربات شیئر کرنے، کامیابیوں کا جشن منانے اور اپنی اجتماعی آواز کو مضبوط بنانے کے لیے باقاعدہ اجتماعات منعقد کرنے کی کوشش کریں گے۔",
                  "<strong>بہتر ہم آہنگی:</strong> ہم تمام اراکین کے درمیان رابطے اور شمولیت کو بہتر بنانے کے لیے وقف ہیں تاکہ ہر نقطہ نظر کو سنا اور اہمیت دی جا سکے۔",
                  "<strong>اراکین کی تعداد میں اضافہ:</strong> ہم پاکستان کی قانونی اور کاروباری برادریوں میں مصالحت کے اثر و رسوخ اور رسائی کو بڑھانے کے لیے نئے پیشہ ور افراد کا گرمجوشی سے خیرمقدم کریں گے۔",
                  "<strong>مصالحت کاروں کے لیے ضابطہ اخلاق:</strong> مزید برآں، اس مدت کے لیے ایک اہم ترجیح پاکستان بار کونسل اور صوبائی بار کونسلوں کے ساتھ ہم آہنگی کے لیے ایک نئی کمیٹی کا قیام ہے۔ یہ اقدام مصالحت کاروں کے لیے ایک جامع ضابطہ اخلاق کو باقاعدہ بنانے پر توجہ مرکوز کرے گا، اس بات کو یقینی بناتے ہوئے کہ ہماری پریکٹس اعلیٰ ترین اخلاقی اور پیشہ ورانہ معیارات پر مبنی رہے۔"
                ],
                closing: "میں آپ سب کو دعوت دیتا ہوں کہ مصالحت کو مرکزی دھارے میں لانے اور پاکستان میں ہم آہنگی اور پیشہ ورانہ مہارت کے کلچر کو فروغ دینے کے اس مشن میں ہمارا ساتھ دیں۔"
              }
            },
            founding_president: {
              name: "انوار کاشف ممتاز",
              role1: "ایڈووکیٹ سپریم کورٹ آف پاکستان",
              role2: "منظور شدہ مصالحت کار",
              heading: "بانی صدر کا پیغام",
              quote: "مل کر، ہم ایک ایسی ثقافت کی تعمیر کر سکتے ہیں جہاں محاذ آرائی پر افہام و تفہیم غالب ہو۔",
              lead: "ہمارا مشن اپنے پیارے ملک کے اندر اخلاقی اور آسان ترین طریقے سے تنازعات کے حل کے لیے مصالحت کو ایک مؤثر ذریعے کے طور پر فروغ دینا ہے۔",
              read_more: "مکمل پیغام پڑھیں",
              sign_role: "ایڈووکیٹ سپریم کورٹ<br>منظور شدہ مصالحت کار",
              popup: {
                p1: "آج، پاکستان میڈیٹرز ایسوسی ایشن کا بانی صدر ہونے کے ناطے، مجھے مکالمے اور پرامن تائید و تصفیہ کے لیے وقف اس پلیٹ فارم کی ترقی دیکھ کر دلی خوشی ہو رہی ہے۔ ہمارا مشن اپنے پیارے ملک کے اندر اخلاقی اور آسان ترین طریقے سے تنازعات کے حل کے لیے مصالحت کو ایک مؤثر ذریعے کے طور پر فروغ دینا ہے۔ ہم اعلیٰ ترین پیشہ ورانہ معیارات کو برقرار رکھنے اور متبادل تنازعات کے حل کے طریقہ کار پر اعتماد کو فروغ دینے کے لیے پرعزم ہیں۔",
                p2: "باهي تعاون، تربيت اور مسلسل سيکهڻ جي ذريعي، هم ملک بهر ۾ مصالحت ڪارن جي صلاحيتن کي مضبوط بنائڻ چاهيون ٿا.",
                p3: "مين تمام شريڪ دارن جي حوصلي افزائي ڪريان ٿو ته اهي انصاف ۽ هم آهنگي جي حصول لاءِ ۽ عدليه جي مدد لاءِ مصالحت کي هڪ تعميري رستي جي طور تي اپنائين.",
                closing: "مل کر، ہم ایک ایسی ثقافت کی تعمیر کر سکتے ہیں جہاں محاذ آرائی پر افہام و تفہیم غالب ہو۔"
              }
            },
            stats: {
              s1_title: "سینکڑوں تربیت یافتہ",
              s1_text: "پورے پاکستان میں وکلاء، ججز اور پیشہ ور افراد کو تربیت دی گئی۔",
              s2_title: "عدالت سے منسلک مصالحت",
              s2_text: "ملک بھر میں مصالحتی اقدامات کا فروغ اور استحکام۔",
              s3_title: "مضبوط تعاون",
              s3_text: "پائیدار تنازعات کے حل کے نظام کے لیے عدلیہ اور شراکت داروں کے ساتھ مل کر کام کرنا۔"
            }
          },
          partners: {
            title: "ہمارے پارٹنرز",
            p1: "سندھ ہائی کورٹ",
            p2: "سرکاری ادارے",
            p3: "انٹرنیشنل میڈیشن انسٹی ٹیوٹ"
          },
        }, "mediation-page": {
          hero: {
            img_alt: "مصالحتی مشاورتی کمرہ",
            eyebrow: "مصالحت (Mediation)",
            title_part1: "تنازعات کا حل تلاش کریں",
            title_part2: "مکالمے اور باہمی افہام و تفہیم کے ذریعے",
            lead: "مصالحت ایک رضاکارانہ، بااعتماد اور منظم عمل ہے جہاں ایک غیر جانبدار ثالث فریقین کو باہمی طور پر قابل قبول اور پائیدار حل تک پہنچنے میں مدد کرتا ہے۔"
          },
          mediation: {
            title1: "مصالحت (Mediation)",
            title2: "کیا ہے؟",
            text1: "مصالحت ایک رضاکارانہ، بااعتماد اور منظم عمل ہے جس میں ایک غیر جانبدار اور بے لوث تیسرا فریق — یعنی ثالث (Mediator) — متنازعہ فریقین کے درمیان بات چیت کو آسان بناتا ہے تاکہ وہ باہمی طور پر قابل قبول اور پائیدار حل تک پہنچ سکیں۔",
            text2: "عدالتی چارہ جوئی (Litigation) کے برعکس، مصالحت باہمی تعاون، خود ارادیت، اور تعمیری طریقے سے مسائل کو حل کرنے پر زور دیتی ہے۔ یہ فریقین کو تعلقات برقرار رکھنے کے ساتھ ساتھ تیز تر اور انتہائی کم لاگت میں نتائج حاصل کرنے کے قابل بناتی ہے۔",
            img_alt: "مصالحت کیا ہے"
          }, whyChoose: {
            heading_part1: "PMA کے ساتھ",
            heading_part2: "مصالحت",
            heading_part3: "کا انتخاب کیوں کریں؟",
            cards: {
              card1: {
                title: "تیز تر اور انتہائی کم لاگت",
                desc: "برسوں کے بجائے چند ہفتوں میں تنازعات کا حل پائیں۔"
              },
              card2: {
                title: "مکمل رازداری",
                desc: "بغیر کسی عوامی ریکارڈ کے ایک نجی اور محفوظ عمل۔"
              },
              card3: {
                title: "تعلقات کو برقرار رکھنا",
                desc: "باہمی افہام و تفہیم اور دونوں فریقین کی کامیابی (win-win) پر توجہ۔"
              },
              card4: {
                title: "لچکدار اور باہمی تعاون",
                desc: "نتائج اور فیصلوں پر فریقین کا اپنا مکمل اختیار۔"
              },
              card5: {
                title: "IMI سے تصدیق شدہ معیار",
                desc: "ثالثین (Mediators) کے لیے بین الاقوامی سطح پر تسلیم شدہ اسناد۔"
              }
            }
          },
          banner: {
            text: "PMA ثالثی کی توثیق، پیشہ ورانہ تربیت، اور وکالت کے لیے پاکستان کی <strong>پہلی اور قدیم ترین</strong> سرشار تنظیم ہے — جو <strong>2013–2014 میں قائم ہوئی</strong> اور اس کا صدر دفتر کراچی میں ہے۔"
          },
          how_it_works: {
            title_part1: "ثالثی (Mediation)",
            title_part2: "کیسے کام کرتی ہے؟",
            img_alt: "ثالثی کا عمل",
            steps: {
              step1: {
                num: "۱",
                title: "اپنی درخواست جمع کروائیں",
                desc: "آپ اپنے تنازعہ کی تفصیلات شیئر کرنے کے لیے PMA سے رابطہ کرتے ہیں۔"
              },
              step2: {
                num: "۲",
                title: "کیس کا ابتدائی جائزہ",
                desc: "ہم معاملے کا جائزہ لیتے ہیں اور ثالثی کے لیے اس کی موزونیت کا تعین کرتے ہیں۔"
              },
              step3: {
                num: "۳",
                title: "ثالث (Mediator) کا تعین",
                desc: "آپ کے کیس کے لیے ایک غیر جانبدار اور اہل ثالث کا تعین کیا جاتا ہے۔"
              },
              step4: {
                num: "۴",
                title: "ثالثی کے باقاعدہ سیشنز",
                desc: "ثالث حل تلاش کرنے کے لیے فریقین کے درمیان منظم اور تعمیری گفتگو کی سہولت فراہم کرتا ہے۔"
              },
              step5: {
                num: "۵",
                title: "تصفیہ اور معاہدہ",
                desc: "فریقین باہمی طور پر قابل قبول نتیجے پر پہنچتے ہیں اور معاہدے کو رسمی شکل دیتے ہیں۔"
              }
            }
          },
          who_we_serve: {
            title_part1: "ہم کن کو",
            title_part2: "خدمات فراہم کرتے ہیں",
            cards: {
              card1: {
                title: "افراد اور خاندان",
                desc: "افراد اور خاندانوں کو ان کے ذاتی اور دیوانی (civil) تنازعات حل کرنے میں مدد فراہم کرنا۔"
              },
              card2: {
                title: "کاروبار اور کارپوریشنز",
                desc: "تجارتی اور کام کی جگہ کے تنازعات کو حل کرنے میں کاروباری اداروں کی معاونت کرنا۔"
              },
              card3: {
                title: "سرکاری ادارے",
                desc: "پبلک سیکٹر کے تنازعات کو حل کرنے میں سرکاری محکموں کی مدد کرنا۔"
              },
              card4: {
                title: "این جی اوز اور کمیونٹی تنظیمیں",
                desc: "کمیونٹی اور سماجی تنظیموں کے لیے تنازعات کے حل کو آسان بنانا۔"
              },
              card5: {
                title: "لا فرمز اور قانونی ماہرین",
                desc: "مؤثر ADR (متبادل تصفیہ تنازعات) کے حل کے لیے قانونی ماہرین کے ساتھ شراکت داری۔"
              }
            }
          },
          cta: {
            title_part1: "آئیں تنازعات کو حل کریں",
            title_part2: "امن و امان کے ساتھ۔",
            subtitle: "مصالحت افہام و تفہیم پیدا کرتی ہے۔ افہام و تفہیم سے حل نکلتے ہیں۔ یہ جاننے کے لیے کہ مصالحت آپ کی کیسے مدد کر سکتی ہے، آج ہی PMA سے رابطہ کریں۔",
            btn_text: "آج ہی ہم سے رابطہ کریں"
          }
        },
        "services-page": {
          hero: {
            img_alt: "خدمات کا ہیرو امیج",
            eyebrow: "ہماری خدمات",
            title_part1: "پیشہ ورانہ مصالحت اور",
            title_part2: "ADR خدمات",
            lead: "PMA مصالحت، تربیت، اور مشاورتی خدمات کا ایک جامع دائرہ فراہم کرتا ہے تاکہ افراد، تنظیموں اور اداروں کو تنازعات کو مؤثر طریقے سے حل کرنے اور باہمی گفتگو کے کلچر کو فروغ دینے میں مدد مل سکے۔"
          },
          work_with: {
            title_part1: "ہم کن کے",
            title_part2: "ساتھ",
            title_part3: "کام کرتے ہیں",
            items: {
              item1: "لا فرمز اورقانونی ماہرین",
              item2: "کارپوریشنز اور کاروباری ادارے",
              item3: "سرکاری ادارے",
              item4: "این جی اوز اور کمیونٹی تنظیمیں",
              item5: "تعلیمی ادارے",
              item6: "عدلیہ اور پبلک سیکٹر"
            }
          },
          services_cta: {
            title_part1: "آئیں مل کر بہتر حل کے",
            title_part2: "نظام تشکیل دیں۔",
            subtitle: "اپنی ضروریات کے مطابق مصالحتی خدمات، پیشہ ورانہ تربیت، اور مشاورتی حل کے لیے PMA کے ساتھ شراکت داری کریں۔",
            btn_text: "رابطہ کریں"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "رابطہ صفحہ کا ہیرو امیج",
            eyebrow: "ہم سے رابطہ کریں",
            title_part1: "ہم آپ کی مدد کے لیے",
            title_part2: "موجود ہیں۔",
            lead: "خواہ آپ کا کوئی سوال ہو، رہنمائی کی ضرورت ہو، یا شراکت داری کے خواہشمند ہوں، ہماری ٹیم آپ کی مدد کے لیے تیار ہے۔ ہم سے رابطہ کریں اور ہم جلد از جلد آپ کو جواب دیں گے۔",
            features: {
              f1_title: "انتہائی خفیہ",
              f1_desc: "آپ کی معلومات ہمیشہ محفوظ رہتی ہیں",
              f2_title: "فوری جواب",
              f2_desc: "ہم عام طور پر 24 گھنٹوں کے اندر جواب دیتے ہیں",
              f3_title: "پیشہ ورانہ مہارت",
              f3_desc: "مصالحتی ماہرین کی تجربہ کار ٹیم"
            }
          },
          contact_section: {
            info_col: {
              title: "رابطہ کریں",
              lead: "ہم آپ کے سوالات کے جوابات دینے اور آپ کے مصالحتی سفر کے لیے درکار تعاون فراہم کرنے کے لیے حاضر ہیں۔",
              labels: {
                address: "دفتر کا پتہ",
                email: "ای میل",
                phone: "فون نمبر",
                whatsapp: "واٹس ایپ",
                hours: "دفتر کے اوقات"
              },
              values: {
                address_text: "253، پی۔ای۔سی۔ایچ۔ایس، بلاک-6، شاہراہِ فیصل، کراچی 75400، پاکستان",
                hours_text: "پیر تا جمعہ صبح 9:00 بجے سے شام 5:00 بجے تک (پاکستانی وقت)"
              }
            },
            form_col: {
              title: "ہمیں پیغام بھیجیں",
              lead: "کچھ تفصیلات شیئر کریں اور ہماری ٹیم جلد ہی آپ سے رابطہ کرے گی۔",
              labels: {
                name: "پورا نام",
                email: "ای میل ایڈریس",
                phone: "فون نمبر",
                inquiry: "پوچھ گچھ کی قسم",
                subject: "موضوع",
                message: "پیغام",
                consent: "تمام گفتگو انتہائی خفیہ ہے اور آپ کی معلومات مکمل محفوظ ہیں۔"
              },
              placeholders: {
                name: "آپ کا نام",
                email: "آپ کی ای میل",
                phone: "آپ کا فون",
                subject: "آپ کے پیغام کا موضوع",
                message: "ہم آپ کی کیا مدد کر سکتے ہیں؟"
              },
              options: {
                default: "ایک آپشن منتخب کریں",
                general: "عمومی پوچھ گچھ",
                mediation: "مصالحتی خدمات",
                training: "تربیت اور سرٹیفیکیشن",
                membership: "ممبرشپ کی معلومات",
                advisory: "ادارتی ADR ایڈوائزری",
                workshops: "ورکشاپس اور آگاہی سیشنز",
                event: "ایونٹ میں شرکت",
                partnership: "شراکت داری اور تعاون",
                media: "میڈیا اور پریس انکوائری",
                consultation: "قانونی / پالیسی مشاورت",
                feedback: "شکایت یا رائے",
                volunteer: "رضاکارانہ مواقع",
                speaker: "اسپیکر / ٹرینر کی درخواست",
                corporate: "کارپوریٹ مصالحتی تعاون",
                community: "کمیونٹی مصالحتی تعاون",
                support: "تکنیکی ویب سائٹ سپورٹ"
              },
              btn_text: "پیغام بھیجیں",
              success_msg: "آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔ ہم 24 گھنٹوں کے اندر آپ سے رابطہ کریں گے۔",
              error_msg: "معذرت، آپ کا پیغام بھیجنے میں کوئی غلطی ہوئی ہے۔ براہ کرم دوبارہ کوشش کریں۔",
              note: "نہ کوئی قانونی عمل، نہ عدالت۔ صرف تصفیہ۔ ہم عام طور پر 24 گھنٹوں کے اندر جواب دیتے ہیں۔"
            }
          },
          "map_section": {
            "title": "ہمارے دفتر تشریف لائیں",
            "lead": "ہم آپ کو کراچی میں واقع ہمارے دفتر میں آمد پر خوش آمدید کہتے ہیں۔",
            "iframe_title": "پی ایم اے آفس لوکیشن — 253، پی۔ای۔سی۔ایچ۔ایس، بلاک-6، کراچی"
          }
        },
        "faq_page": {
          "hero": {
            "img_alt": "سوالات کے جوابات کا ہیرو امیج",
            "title": "عام طور پر پوچھے جانے والے سوالات",
            "lead": "مصالحت اور ہماری خدمات کے بارے میں عام طور پر پوچھے جانے والے سوالات کے جوابات یہاں تلاش کریں۔"
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "مصالحت (MEDIATION) کی معیاری شق کیا ہے؟",
                "answer": "اس معاہدے کے فریقین کے درمیان پیدا ہونے والے کسی بھی اور ہر قسم کے تنازعہ، اختلاف یا سوال کو پہلے فریقین باہمی مذاکرات کے ذریعے دوستانہ طور پر حل کرنے کی کوشش کریں گے۔ اگر تنازعات، اختلافات یا سوالات دوستانہ تصفیہ کے لیے ایک فریق کی طرف سے دوسرے فریق کی درخواست کی وصولی کے بعد تیس (30) دنوں کے اندر خط و کتابت یا باہمی بحث کے ذریعے خوش اسلوبی یا تسلی بخش طریقے سے حل نہیں ہوسکتے، تو اسے پی ایم اے (PMA) کے تسلیم شدہ مصالحتی پینل کو بھیجا جائے گا۔ مصالحت کی کارروائی بین الاقوامی سطح پر تسلیم شدہ قوانین کے تحت چلائی جائے گی۔"
              },
              "q2": {
                "question": "وقت اور لاگت کا ایک متبادل – مصالحت",
                "answer": "مصالحت طویل قانونی کارروائیوں کا ایک تیز رفتار، کفایتی اور خفیہ متبادل پیش کرتی ہے۔ یہ پیشہ ورانہ اور ذاتی تعلقات کو برقرار رکھتے ہوئے فریقین کو دوستانہ طور پر تنازعات حل کرنے میں مدد دیتی ہے۔"
              },
              "q3": {
                "question": "مصالحت (MEDIATION) کیا ہے؟",
                "answer": "مصالحت ایک رضاکارانہ اور خفیہ عمل ہے جس میں ایک غیر جانبدار تیسرا فریق تنازعہ کے شکار فریقین کو باہمی طور پر قابل قبول معاہدے تک پہنچنے میں مدد فراہم کرتا ہے۔"
              },
              "q4": {
                "question": "مصالحت کے لیے کیسے رجوع کریں؟",
                "answer": "آپ مصالحتی خدمات شروع کرنے کے لیے ہماری ویب سائٹ یا دفتر کے ذریعے پی ایم اے (PMA) سے رابطہ کر سکتے ہیں۔ ہماری ٹیم اس پورے عمل میں آپ کی رہنمائی کرے گی اور آپ کو مستند مصالحتی ماہرین سے منسلک کرے گی۔"
              },
              "q5": {
                "question": "مصالحت کے فوائد",
                "benefits_list": {
                  "b1": "تنازعات کا تیز رفتار حل",
                  "b2": "کم قانونی اخراجات",
                  "b3": "خفیہ تصفیہ کی کارروائی",
                  "b4": "لچکدار حل",
                  "b5": "فریقین کے درمیان بہتر رابطہ و مواصلات"
                }
              },
              "q6": {
                "question": "مصالحت کا سیشن کب منعقد ہوگا؟",
                "answer": "مصالحت کے سیشن کا شیڈول دونوں فریقین اور ثالث (ثالثی کار) کی دستیابی کی بنیاد پر طے کیا جاتا ہے۔ پی ایم اے سہولت اور کارکردگی کو یقینی بنانے کے لیے اس عمل کو مربوط کرتا ہے۔"
              },
              "q7": {
                "question": "مصالحت کے دوران کیا ہوتا ہے؟",
                "answer": "مصالحت کے دوران، دونوں فریقین ایک ثالث کی موجودگی میں ایک منظم ماحول میں اپنے تحفظات پر بات کرتے ہیں، جو حل اور مشترکہ نکات تلاش کرنے میں مدد کرتا ہے۔"
              },
              "q8": {
                "question": "اگر کوئی معاہدہ طے نہ پائے تو کیا ہوتا ہے؟",
                "answer": "اگر مصالحت کے نتیجے میں کوئی معاہدہ طے نہیں پاتا، تو دونوں فریق اپنے پاس موجود دیگر قانونی متبادلات یا تنازعات کے حل کے اختیارات حاصل کرنے کے لیے آزاد رہتے ہیں۔"
              },
              "q9": {
                "question": "مصالحت کے سیشن میں کون شرکت کر سکتا ہے؟",
                "answer": "مصالحت کے سیشن میں صرف متعلقہ فریقین، ان کے مجاز نمائندے، قانونی مشیر (اگر اجازت ہو) اور ثالث ہی شرکت کر سکتے ہیں۔"
              },
              "q10": {
                "question": "اس پر کتنی لاگت آئے گی؟",
                "answer": "مصالحت کے اخراجات کا انحصار تنازعہ کی نوعیت، پیچیدگی اور مدت پر ہوتا ہے۔ پی ایم اے مصالحتی عمل شروع ہونے سے پہلے فیس کی تمام تفصیلات فراہم کرتا ہے۔"
              }
            },
            "contact_box": {
              "title": "ابھی بھی کوئی سوال ہے؟",
              "lead": "ہم آپ کی مدد کے لیے حاضر ہیں۔ ہم سے رابطہ کریں اور ہماری ٹیم کو آپ کی رہنمائی کر کے خوشی ہوگی۔",
              "btn_text": "ہم سے رابطہ کریں"
            }
          }
        },
        "training-page": {
          "hero": {
            "hero_img_alt": "تربیت کا ہیرو امیج",
            "eyebrow": "پیشہ ورانہ تربیت",
            "title_part1": "بین الاقوامی سطح پر تسلیم شدہ تربیت کے ذریعے",
            "title_part2": "پاکستان کے مستقبل کے مصالحت کاروں کی تیاری",
            "lead": "اپنی صلاحیتوں کو مضبوط کریں۔ اپنے طریقہ کار کو بہتر بنائیں۔ معاشرے میں مکالمے، افہام و تفہیم اور پرامن حل کو فروغ دیں۔",
            "banner": {
              "logo_alt": "انٹرنیشنل میڈیشن انسٹی ٹیوٹ",
              "title": "آئی ایم آئی (IMI) سے تصدیق شدہ میڈیٹر ٹریننگ پروگرام",
              "tagline": "بین الاقوامی سطح پر تسلیم شدہ۔ عالمی سطح پر معتبر۔",
              "desc": "پی ایم اے (PMA) انٹرنیشنل میڈیشن انسٹی ٹیوٹ (IMI) کے ساتھ ایک باقاعدہ رجسٹرڈ ٹریننگ فراہم کنندہ ہے۔ ہمارا IMI سے تصدیق شدہ میڈیٹر ٹریننگ پروگرام پیشہ ورانہ مصالحتی تربیت کے اعلیٰ ترین عالمی معیاروں پر پورا اترتا ہے۔",
              "link_text": "مزید معلومات کے لیے براہ کرم اس لنک پر کلک کریں"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "ہمارے",
              "title_part2": "تربیت کے",
              "title_part3": "پروگرامز"
            },
            "programs": {
              "accredited_course": {
                "badge": "ایکرedited (مسلمہ) کورس",
                "title": "مصالحتی مہارتوں کا ایکریڈیٹڈ کورس",
                "desc_p1": "یہ کورس ان لوگوں کے لیے ہے جو مصالحتی مہارتوں کو جاننے میں دلچسپی رکھتے ہیں۔ ایک امیدوار اس عمل سے مکمل واقفیت حاصل کر لے گا۔",
                "desc_p2": "تمام کورسز عملی مشقوں اور رول پلے (کردار نگاری) کے ذریعے کروائے جاتے ہیں۔",
                "metrics": {
                  "total_hours": "کل گھنٹے",
                  "days": "دن (منگل تا ہفتہ)",
                  "daily_hours": "روزانہ کے گھنٹے",
                  "cert_status": "سرٹیفکیٹ",
                  "cert_sub": "تسلیم شدہ (Accredited)"
                },
                "outcomes": {
                  "headline": "کورس کے اختتام پر شرکاء اس قابل ہو جائیں گے کہ:",
                  "list": {
                    "item1": "مصالحت میں مہارت حاصل کر سکیں",
                    "item2": "مصالحت کے بہترین طریقوں کو سیکھ سکیں",
                    "item3": "مصالحت سے متعلق پاکستان کے قوانین جان سکیں",
                    "item4": "مذاکرات کی مہارتیں سیکھ سکیں",
                    "item5": "سند یافتہ مصالحت کار بن سکیں"
                  }
                },
                "btn_text": "کورس کی تفصیلات دیکھیں"
              },
              "introductory_course": {
                "badge": "نان-ایکریڈیٹڈ کورس",
                "title": "مصالحتی مہارتوں کا تعارفی کورس",
                "desc_p1": "یہ کورس ان لوگوں کے لیے ہے جو مصالحتی مہارتوں کی بنیادی سمجھ بوجھ حاصل کرنے میں دلچسپی رکھتے ہیں۔ یہ بالکل ابتدائی سطح کا کورس ہے۔",
                "desc_p2": "اس میں کوئی عملی مشقیں یا رول پلے شامل نہیں ہیں۔",
                "metrics": {
                  "total_hours": "کل گھنٹے",
                  "days": "دن (جلد اعلان کیا جائے گا)",
                  "daily_hours": "روزانہ کے گھنٹے",
                  "cert_status": "غیر تسلیم شدہ (Non-Accredited)"
                },
                "btn_text": "کورس کی تفصیلات دیکھیں"
              },
              "basic_info_course": {
                "badge": "نان-ایکریڈیٹڈ کورس",
                "title": "مصالحتی مہارتوں کے بارے میں بنیادی معلومات",
                "desc_p1": "یہ کورس ان لوگوں کے لیے ہے جو مصالحتی مہارتوں کی بنیادی سمجھ بوجھ حاصل کرنے میں دلچسپی رکھتے ہیں۔ یہ بالکل ابتدائی سطح کا کورس ہے۔",
                "desc_p2": "اس میں کوئی عملی مشقیں یا رول پلے شامل نہیں ہیں۔",
                "metrics": {
                  "total_hours": "کل گھنٹے",
                  "days": "دن",
                  "daily_hours": "روزانہ کے گھنٹے",
                  "cert_status": "غیر تسلیم شدہ (Non-Accredited)"
                },
                "btn_text": "کورس کی تفصیلات دیکھیں"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "کسے",
              "title_part2": "شرکت",
              "title_part3": "کرنی چاہیے؟",
              "subtitle": "یہ تربیت ان پیشہ ور افراد کے لیے تیار کی گئی ہے جو مثبت تبدیلی لانا چاہتے ہیں"
            },
            "cards": {
              "c1": {
                "title": "وکلاء اور قانونی پیشہ ور افراد",
                "desc": "اپنے تنازعات کے حل کی مہارتوں کو بہتر بنائیں اور اپنے پیشہ ورانہ دائرہ کار کو وسعت دیں۔"
              },
              "c2": {
                "title": "ججز اور عدالتی حکام",
                "desc": "اے ڈی آر (ADR) کی اپنی سمجھ بوجھ کو مضبوط کریں اور مقدمات کے مؤثر انتظام میں مدد کریں۔"
              },
              "c3": {
                "title": "کارپوریٹ پیشہ ور افراد",
                "desc": "کام کی جگہ پر مذاکرات، روابط اور تنازعات کے انتظام کو بہتر بنائیں۔"
              },
              "c4": {
                "title": "ایچ آر اور ایڈمنڈ کے پیشہ ور افراد",
                "desc": "افراد پر مرکوز تنازعات کا حل اور کام کی جگہ پر ہم آہنگی پیدا کریں۔"
              },
              "c5": {
                "title": "این جی اوز اور کمیونٹی رہنما",
                "desc": "برادری کے تنازعات کو حل کریں اور سماجی ہم آہنگی اور شمولیت کو فروغ دیں۔"
              },
              "c6": {
                "title": "طلباء اور اے ڈی آر کے شوقین",
                "desc": "مصالحت میں اپنے سفر کا آغاز کریں اور اے ڈی آر (ADR) میں ایک مضبوط بنیاد بنائیں۔"
              },
              "c7": {
                "title": "سرکاری حکام",
                "desc": "عوامی شعبے کے تنازعات اور پالیسی کے نفاذ پر مصالحت کی مہارتیں لاگو کریں۔"
              },
              "c8": {
                "title": "اے ڈی آر اور مصالحت میں دلچسپی رکھنے والا کوئی بھی فرد",
                "desc": "ان تمام لوگوں کے لیے کھلا ہے جو پرامن مکالمے اور تنازعات کے حل کا جذبہ رکھتے ہیں۔"
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "مختلف پس منظر، ایک ہی مقصد",
            "title": "مختلف پس منظر۔ ایک ہی مقصد: پرامن تصفیہ۔",
            "desc": "ہماری تربیت مختلف شعبوں سے تعلق رکھنے والے ایسے پیشہ ور افراد کو یکجا کرتی ہے جو مکالمے، افہام و تفہیم اور بہتر معاشرے کی تعمیر پر یقین رکھتے ہیں۔",
            "btn_text": "کورس کے لیے رجسٹریشن کریں"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "ہمارے پروگرام میں شامل ہوں",
              "title": "ہمارے مصالحتی تربیتی پروگراموں کا حصہ بنیں",
              "tagline": "اعلیٰ کارکردگی کی طرف پہلا قدم بڑھائیں",
              "desc": "آج ہی رجسٹریشن کروائیں اور بین الاقوامی سطح پر تسلیم شدہ تربیتی پروگراموں کا حصہ بنیں جو آپ کی مہارتوں کو نکھارنے، آپ کے پیشے کو مضبوط بنانے اور معاشرے میں پرامن حل کو فروغ دینے کے لیے ڈیزائن کیے گئے ہیں۔",
              "img_alt": "زن میڈیٹیشن اسٹونز",
              "seat_badge": {
                "title": "اپنی نشست محفوظ کریں",
                "desc_part1": "محدود نشستیں",
                "desc_part2": "ہر بیچ میں دستیاب ہیں۔"
              }
            },
            "form_panel": {
              "header_title": "رجسٹریشن کی تفصیلات",
              "labels": {
                "name": "پورا نام",
                "email": "ای میل ایڈریس",
                "phone": "فون نمبر",
                "background": "پیشہ ورانہ پس منظر",
                "city": "شہر",
                "program": "تربیتی پروگرام منتخب کریں",
                "additional_info": "اضافی معلومات (اختیاری)"
              },
              "placeholders": {
                "name": "اپنا پورا نام درج کریں",
                "email": "اپنا ای میل ایڈریس درج کریں",
                "phone": "اپنا فون نمبر درج کریں",
                "background": "مثلاً وکیل، ایچ آر پروفیشنل، طالب علم",
                "city": "اپنا شہر درج کریں",
                "program_default": "-- براہ کرم ایک پروگرام منتخب کریں --",
                "additional_info": "کوئی بھی اضافی معلومات جو آپ شیئر کرنا چاہیں"
              },
              "options": {
                "accredited": "مصالحتی مہارتوں کا ایکریڈیٹڈ کورس",
                "introductory": "مصالحتی مہارتوں کا تعارفی کورس",
                "basic": "مصالحتی مہارتوں کے بارے میں بنیادی معلومات"
              },
              "btn_text": "داخلے کے لیے درخواست دیں",
              "privacy_note": "آپ کی معلومات محفوظ ہیں اور صرف رجسٹریشن کے مقاصد کے لیے استعمال کی جائیں گی۔",
              "messages": {
                "success": "رجسٹریشن جمع ہو گئی! ہم 24 گھنٹے کے اندر آپ سے رابطہ کریں گے۔",
                "error": "معذرت، آپ کی رجسٹریشن جمع کرنے میں ایک خرابی پیش آئی ہے۔ براہ کرم دوبارہ کوشش کریں۔"
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "آئی ایم آئی (IMI) سے تسلیم شدہ",
                "desc": "ہمارے پروگرامز انٹرنیشنل میڈیشن انسٹی ٹیوٹ (IMI) سے تصدیق شدہ ہیں۔"
              },
              "b2": {
                "title": "ماہر ٹرینرز",
                "desc": "تجربہ کار مصالحت کاروں اور صنعتی ماہرین سے سیکھیں۔"
              },
              "b3": {
                "title": "بین الاقوامی معیار",
                "desc": "عالمی سطح پر مقبول مصالحتی معیاروں کے مطابق تربیت۔"
              },
              "b4": {
                "title": "پیشہ ورانہ سرٹیفیکیشن",
                "desc": "کامیابی سے تکمیل پر ایک تسلیم شدہ سرٹیفکیٹ حاصل کریں۔"
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "ایکرedited (مسلمہ) کورس",
              "title_part1": "مصالحتی مہارتوں کا",
              "title_part2": "ایکرedited کورس",
              "desc": "یہ کورس ان لوگوں کے لیے ہے جو مصالحتی مہارتوں کو جاننے میں دلچسپی رکھتے ہیں۔ ایک امیدوار اس عمل سے مکمل واقفیت حاصل کر لے گا۔ تمام کورسز عملی مشقوں اور رول پلے (کردار نگاری) کے ذریعے کروائے جاتے ہیں۔",
              "stats": {
                "type": { "label": "تسلیم شدہ کورس", "value": "سرٹیفکیٹ تسلیم شدہ" },
                "total_hours": { "label": "کل گھنٹے", "value": "40" },
                "duration": { "label": "دورانیہ", "value": "5 دن (ایک ہفتہ)" },
                "daily_hours": { "label": "روزانہ کے گھنٹے", "value": "8" },
                "days": { "label": "تربیت کے دن", "value": "منگل تا ہفتہ" },
                "time": { "label": "تربیت کا وقت", "value": "صبح 9 بجے سے شام 5 بجے تک" }
              }
            },
            "main_content": {
              "about": {
                "title": "کورس کے بارے میں",
                "desc": "یہ جامع پروگرام شرکاء کو مصالحت کی عملی مہارتوں، مذاکرات کی تکنیکوں اور مصالحت سے متعلق پاکستانی قوانین کی سمجھ بوجھ سے آراستہ کرتا ہے۔ عملی سیکھنے، مشقوں اور رول پلے کے ذریعے شرکاء کو حقیقی زندگی کے تنازعات کو مؤثر اور اخلاقی طور پر حل کرنے کے لیے تیار کیا جائے گا۔"
              },
              "outcomes": {
                "title": "آپ کیا سیکھیں گے",
                "items": [
                  "مصالحت میں مہارت حاصل کرنا",
                  "مصالحت کے بہترین طریقوں کو سیکھنا",
                  "مصالحت سے متعلق پاکستان کے قوانین جاننا",
                  "مذاکرات کی مہارتیں سیکھنا",
                  "سند یافتہ مصالحت کار بننا",
                  "مؤثر تصفیہ کے معاہدے تیار کرنا"
                ]
              },
              "columns": {
                "outline": {
                  "title": "کورس کا خاکہ",
                  "items": [
                    "متبادل تنازعات کے حل (ADR) کا منظرنامہ",
                    "مصالحت کے مراحل اور فیزز",
                    "غیر زبانی اور زبانی رابطہ (Communication)",
                    "مذاکرات کا انداز (Negotiation Style)",
                    "سوالات کرنے کی تکنیک",
                    "ممکنہ معاہدے کا دائرہ کار (Zone of Potential Agreement)",
                    "مردہ لاک (Deadlock) کو ختم کرنا",
                    "تصفیہ کے معاہدے کا مسودہ بنانا",
                    "مصالحت کے لیے موزوں مقدمات",
                    "ذاتی تشخیص (Self-assessment)",
                    "سودے بازی کی تکنیکیں"
                  ]
                },
                "structure": {
                  "title": "کورس کی ساخت",
                  "modules": [
                    { "badge": "ماڈیول 01", "title": "متبادل تنازعات کے حل (ADR) کا خاکہ" },
                    { "badge": "ماڈیول 02", "title": "مصالحتی عمل اور اس کے مراحل" },
                    { "badge": "ماڈیول 03", "title": "روابط اور سوالات کرنے کا طریقہ" },
                    { "badge": "ماڈیول 04", "title": "مذاکرات کی تکنیکیں" },
                    { "badge": "ماڈیول 05", "title": "ڈیڈ لاک کا حل" },
                    { "badge": "ماڈیول 06", "title": "معاہدے کا مسودہ اور تکمیل" },
                    { "badge": "ماڈیول 07", "title": "ذاتی تشخیص اور بہترین طریقہ کار" }
                  ]
                },
                "methodology": {
                  "title": "تربیت کا طریقہ کار",
                  "items": [
                    "تجرباتی اور عملی سیکھنا",
                    "عملی مشقیں",
                    "رول پلے اور سیمولیشنز",
                    "گروپ ڈسکشن (مباحثے)",
                    "کیس اسٹڈیز (حقیقی مثالیں)",
                    "انٹرایکٹو سیشنز"
                  ]
                }
              },
              "certification": {
                "title": "سرٹیفیکیشن کا نتیجہ",
                "desc": "کامیاب شرکت پر شرکاء کو تکمیل کا سرٹیفکیٹ دیا جائے گا۔ یہ کورس افراد کو مختلف ماحول میں اخلاقی، پیشہ ورانہ اور مؤثر طریقے سے مصالحتی مہارتیں لاگو کرنے کے لیے تیار کرتا ہے۔"
              },
              "attendees": {
                "title": "کسے شرکت کرنی چاہیے؟",
                "items": [
                  "وکلاء اور قانونی پیشہ ور افراد",
                  "ججز اور عدالتی حکام",
                  "کارپوریٹ پیشہ ور افراد",
                  "ایچ آر اور ایڈمن کے پیشہ ور افراد",
                  "این جی اوز اور کمیونٹی رہنما",
                  "طلباء اور اے ڈی آر کے شوقین"
                ]
              },
              "btn_text": "اس پروگرام کے لیے درخواست دیں"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "نان-ایکریڈیٹڈ کورس",
              "title_part1": "مصالحتی مہارتوں کا",
              "title_part2": "تعارفی کورس",
              "desc": "یہ کورس ان لوگوں کے لیے تیار کیا گیا ہے جو مصالحتی مہارتوں کے بارے میں بنیادی معلومات حاصل کرنا چاہتے ہیں۔ یہ ایک انتہائی ابتدائی سطح کا کورس ہے اور غیر تسلیم شدہ ہے۔",
              "stats": {
                "type": { "label": "نان-ایکریڈیٹڈ کورس", "value": "" },
                "total_hours": { "label": "کل گھنٹے", "value": "16" },
                "duration": { "label": "دورانیہ", "value": "2 کاروباری دن" },
                "daily_hours": { "label": "روزانہ کے گھنٹے", "value": "8" },
                "days": { "label": "تربیت کے دن", "value": "کوئی بھی دو دن (جلد اعلان کیا جائے گا)" },
                "time": { "label": "تربیت کا وقت", "value": "صبح 9 بجے سے شام 5 بجے تک" }
              }
            },
            "main_content": {
              "about": {
                "title": "کورس کے بارے میں",
                "desc": "یہ تعارفی کورس مصالحتی مہارتوں اور مصالحت کے عمل کی بنیادی سمجھ فراہم کرتا ہے۔ شرکاء مصالحت کے عمل سے اچھی طرح واقف ہو جائیں گے اور یہ سمجھنے کے قابل ہوں گے کہ اس کا مستقبل کیا ہے۔ یہ کورس مکمل طور پر نظریاتی (Theory-oriented) ہے جس میں کوئی عملی مشق یا رول پلے شامل نہیں ہے۔"
              },
              "outcomes": {
                "title": "آپ کیا سیکھیں گے",
                "items": [
                  "مصالحت کی بنیادی باتوں کو سمجھنا",
                  "مصالحت کے اہم تصورات کو جاننا",
                  "یہ سمجھنا کہ مصالحت کا استعمال کب کیا جا سکتا ہے",
                  "مصالحتی عمل کے بارے میں آگاہی حاصل کرنا",
                  "ایک باخبر اور واقف کار صارف بننا"
                ]
              },
              "columns": {
                "outline": {
                  "title": "کورس کا خاکہ",
                  "items": [
                    "متبادل تنازعات کے حل (ADR) کا منظرنامہ",
                    "مصالحت کے مراحل اور فیزز",
                    "غیر زبانی اور زبانی رابطہ (Communication)",
                    "مذاکرات کا انداز (Negotiation Style)",
                    "سوالات کرنے کی تکنیک",
                    "ممکنہ معاہدے کا دائرہ کار (Zone of Potential Agreement)",
                    "مردہ لاک (Deadlock) کو ختم کرنا",
                    "تصفیہ کے معاہدے کا مسودہ بنانا",
                    "مصالحت کے لیے موزوں مقدمات",
                    "سودے بازی کی تکنیکیں"
                  ]
                },
                "info_table": {
                  "title": "کورس کی معلومات",
                  "trainer": { "label": "ٹرینر", "value": "جلد اعلان کیا جائے گا (TBA)" },
                  "daily_hours": { "label": "روزانہ کے گھنٹے", "value": "آٹھ (8)" },
                  "total_hours": { "label": "کل گھنٹے", "value": "سولہ (16)" },
                  "days": { "label": "تربیت کے دن", "value": "کوئی بھی دو دن (جلد اعلان کیا جائے گا)" },
                  "time": { "label": "تربیت کا وقت", "value": "صبح 9 بجے سے شام 5 بجے تک" },
                  "duration": { "label": "کورس کا دورانیہ", "value": "دو (2) کاروباری دن" },
                  "type": { "label": "کورس کی قسم", "value": "نان-ایکریڈیٹڈ کورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "کسے شرکت کرنی چاہیے؟",
                  "items": [
                    "طلباء اور نئے گریجویٹس",
                    "کسی بھی شعبے سے تعلق رکھنے والے پیشہ ور افراد",
                    "ایچ آر اور ایڈمن کے پیشہ ور افراد",
                    "این جی اوز اور کمیونٹی ورکرز",
                    "مصالحت میں دلچسپی رکھنے والا کوئی بھی فرد"
                  ]
                },
                "note": {
                  "title": "اہم نوٹ",
                  "desc": "یہ ایک بنیادی سطح کا کورس ہے جو صرف معلومات اور آگاہی فراہم کرنے کے لیے تیار کیا گیا ہے۔ اس کورس میں کوئی عملی مشق، رول پلے یا ذاتی تشخیص شامل نہیں ہے۔"
                }
              },
              "btn_text": "اس کورس کے لیے رجسٹریشن کریں"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "نان-ایکریڈیٹڈ کورس",
              "title_part1": "بنیادی معلومات برائے",
              "title_part2": "مصالحتی مہارتیں",
              "desc": "یہ تعارفی کورس مصالحتی مہارتوں اور ان کے استعمال کے بارے میں عمومی بیداری فراہم کرنے کے لیے ڈیزائن کیا گیا ہے۔ یہ ایک بنیادی سطح کا کورس ہے اور غیر تسلیم شدہ ہے۔",
              "stats": {
                "type": { "label": "نان-ایکریڈیٹڈ کورس", "value": "" },
                "total_hours": { "label": "کل گھنٹے", "value": "8" },
                "duration": { "label": "دورانیہ", "value": "1 دن" },
                "daily_hours": { "label": "روزانہ کے گھنٹے", "value": "8" },
                "days": { "label": "تربیت کے دن", "value": "کوئی بھی دن (جلد اعلان کیا جائے گا)" },
                "time": { "label": "تربیت کا وقت", "value": "صبح 9 بجے سے شام 5 بجے تک" }
              }
            },
            "main_content": {
              "about": {
                "title": "کورس کے بارے میں",
                "desc": "یہ بنیادی معلوماتی کورس مصالحتی مہارتوں، مصالحت کے عمل، اور تنازعات کے حل کے کلیدی تصورات کے بارے میں عمومی آگاہی فراہم کرنے کے لیے ڈیزائن کیا گیا ہے۔ شرکاء بغیر کسی رول پلے یا عملی مشقوں کے مصالحت کے طریقہ کار کی بنیادی سمجھ حاصل کریں گے۔"
              },
              "outcomes": {
                "title": "آپ کیا سیکھیں گے",
                "items": [
                  "مصالحت کی بنیادی باتوں کو سمجھنا",
                  "مصالحت کے اہم تصورات کو جاننا",
                  "یہ سمجھنا کہ مصالحت کا استعمال کب کیا جا سکتا ہے",
                  "مصالحتی عمل کے بارے میں آگاہی حاصل کرنا",
                  "تنازعات کے حل کے بنیادی تصورات"
                ]
              },
              "columns": {
                "outline": {
                  "title": "کورس کا خاکہ",
                  "items": [
                    "متبادل تنازعات کے حل (ADR) کا منظرنامہ",
                    "مصالحت کے مراحل اور فیزز",
                    "مصالحت کا تعارف",
                    "مصالحتی عمل کا جائزہ",
                    "مصالحت میں روابط (Communication)",
                    "سوالات اور وضاحتیں",
                    "ڈیڈ لاک (خنڈ) کو سمجھنا",
                    "معاہدے کے بنیادی اصول"
                  ]
                },
                "info_table": {
                  "title": "کورس کی معلومات",
                  "trainer": { "label": "ٹرینر", "value": "جلد اعلان کیا جائے گا (TBA)" },
                  "daily_hours": { "label": "روزانہ کے گھنٹے", "value": "آٹھ (8)" },
                  "total_hours": { "label": "کل گھنٹے", "value": "آٹھ (8)" },
                  "days": { "label": "تربیت کے دن", "value": "کوئی بھی دن (جلد اعلان کیا جائے گا)" },
                  "time": { "label": "تربیت کا وقت", "value": "صبح 9 بجے سے شام 5 بجے تک" },
                  "duration": { "label": "کورس کا دورانیہ", "value": "ایک (1) دن" },
                  "type": { "label": "کورس کی قسم", "value": "نان-ایکریڈیٹڈ کورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "کسے شرکت کرنی چاہیے؟",
                  "items": [
                    "طلباء اور نئے گریجویٹس",
                    "کسی بھی شعبے سے تعلق رکھنے والے پیشہ ور افراد",
                    "ایچ آر اور ایڈمن کے پیشہ ور افراد",
                    "این جی اوز اور کمیونٹی ورکرز",
                    "مصالحت میں دلچسپی رکھنے والا کوئی بھی فرد"
                  ]
                },
                "note": {
                  "title": "اہم نوٹ",
                  "desc": "یہ ایک بنیادی سطح کا کورس ہے جو صرف عمومی معلومات اور آگاہی فراہم کرنے کے لیے ڈیزائن کیا گیا ہے۔ اس کورس میں کوئی عملی مشق، رول پلے یا ذاتی تشخیص شامل نہیں ہے۔"
                }
              },
              "btn_text": "اس کورس کے لیے رجسٹریشن کریں"
            }
          }
        },
        "leadership_page": {
          "hero": {
            "eyebrow": "قیادت",
            "title_main": "قیادت",
            "title_accent": "ہمارے لوگ۔ ہماری طاقت",
            "lead_text": "پاکستان بھر میں مکالمے، افہام و تفہیم اور پرامن حل کے فروغ کے لیے PMA کے مشن کی رہنمائی کرنے والے مخلص اور پرعزم پیشہ ور افراد سے ملیے۔"
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "ایگزیکٹو ٹیم",
              "sub_committee": "ذیلی کمیٹی",
              "mediator": "مصالحین (میڈی ایٹرز)",
              "trainer": "تربیت کار (ٹرینرز)",
              "former_president": "سابق صدور"
            },
            "search_placeholder": "نام یا مہارت کے ذریعے تلاش کریں..."
          },
          "members": {
            "member_1": {
              "name": "آغا ظفر احمد",
              "title": "صدر",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "آغا ظفر احمد کا پروفائل دیکھیں"
            },
            "member_2": {
              "name": "صائمہ امین خواجہ",
              "title": "نائب صدر – نارتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "صائمہ امین خواجہ کا پروفائل دیکھیں"
            },
            "member_3": {
              "name": "اسفند یار علی خان",
              "title": "نائب صدر – نارتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "اسفند یار علی خان کا پروفائل دیکھیں"
            },
            "member_4": {
              "name": "سعید حبیب",
              "title": "نائب صدر – ساؤتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم"
              },
              "aria_label": "سعید حبیب کا پروفائل دیکھیں"
            },
            "member_5": {
              "name": "شبانہ علی",
              "title": "نائب صدر – ساؤتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثاث (Mediator)",
                "pma_accredited": "PMA سے منظور شدہ ثالث"
              },
              "aria_label": "شبانہ علی کا پروفائل دیکھیں"
            },
            "member_6": {
              "name": "وجیہہ علیم",
              "title": "سیکرٹری جنرل",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "وجیہہ علیم کا پروفائل دیکھیں"
            },
            "member_7": {
              "name": "سید صمد الحق",
              "title": "فنانس سیکرٹری",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم"
              },
              "aria_label": "سید صمد الحق کا پروفائل دیکھیں"
            },
            "member_8": {
              "name": "طارق سعید رانا",
              "title": "ایگزیکٹو کمیٹی – نارتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "طارق سعید رانا کا پروفائل دیکھیں"
            },
            "member_9": {
              "name": "ہما شاہ",
              "title": "ایگزیکٹو کمیٹی – نارتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "ہما شاہ کا پروفائل دیکھیں"
            },
            "member_10": {
              "name": "امیمہ انور خان",
              "title": "ایگزیکٹو کمیٹی – ساؤتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم"
              },
              "aria_label": "امیمہ انور خان کا پروفائل دیکھیں"
            },
            "member_11": {
              "name": "مستنصر ذاکر",
              "title": "ایگزیکٹو کمیٹی – ساؤتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "مستنصر ذاکر کا پروفائل دیکھیں"
            },
            "member_12": {
              "name": "عدنان مفتی",
              "title": "ایگزیکٹو کمیٹی – ساؤتھ",
              "badges": {
                "executive_team": "ایگزیکٹو ٹیم",
                "mediator": "ثالث (Mediator)",
                "cedr_accredited": "CEDR سے منظور شدہ ثالث"
              },
              "aria_label": "عدنان مفتی کا پروفائل دیکھیں"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "مستنصر ذاکر",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "director_training": "ڈائریکٹر ٹریننگ",
                "ex_president": "سابق صدر"
              },
              "aria_label": "مستنصر ذاکر کا پروفائل دیکھیں"
            },
            "trainer_2": {
              "name": "انور کاشف ممتاز",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "ex_president": "سابق صدر",
                "leadership_trainer": "لیڈرشپ ٹرینر"
              },
              "aria_label": "انور کاشف ممتاز کا پروفائل دیکھیں"
            },
            "trainer_3": {
              "name": "طارق سعید رانا",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "ex_president": "سابق صدر",
                "executive_committee_north": "ایگزیکٹو کمیٹی – نارتھ"
              },
              "aria_label": "طارق سعید رانا کا پروفائل دیکھیں"
            },
            "trainer_4": {
              "name": "صائمہ امین خواجہ",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "executive_member": "ایگزیکٹو ممبر",
                "vice_president_north": "نائب صدر – نارتھ"
              },
              "aria_label": "صائمہ امین خواجہ کا پروفائل دیکھیں"
            },
            "trainer_5": {
              "name": "ہما شاہ",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "executive_committee_north": "ایگزیکٹو کمیٹی – نارتھ",
                "training_committee": "ٹریننگ کمیٹی"
              },
              "aria_label": "ہما شاہ کا پروفائل دیکھیں"
            },
            "trainer_6": {
              "name": "عثمان جی راشد",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "barrister_at_law": "بیریسٹر ایٹ لاء",
                "former_secretary_general": "سابق سیکرٹری جنرل – PMA"
              },
              "aria_label": "عثمان جی راشد کا پروفائل دیکھیں"
            },
            "trainer_7": {
              "name": "اسفند یار علی خان",
              "title": "ماسٹر ٹرینر",
              "badges": {
                "master_trainer": "ماسٹر ٹرینر",
                "executive_leadership": "ایگزیکٹو لیڈرشپ",
                "vice_president_north": "نائب صدر – نارتھ"
              },
              "aria_label": "اسفند یار علی خان کا پروفائل دیکھیں"
            }
          },
          "modal": {
    "about_label": "تعارف",
    "expertise_title": "مہارت",
    "training_expertise_title": "تربیتی مہارت",
    "accreditations_title": "اعتمادیات / اسناد",
    "education_title": "تعلیم",
    "affiliations_title": "پیشہ ورانہ الحاق",
    "media_title": "میڈیا اور عوامی شمولیت",
    "coming_soon": "عنقریب",
    "profile_close_label": "پروفائل بند کریں"
  },
  "profile_modal": {
    "aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "صدر",
    "highlight": "\"قیادت، وکالت اور اے ڈی آر (ADR) کی مہارت کے ذریعے ثالثی اور بین الاقوامی تنازعات کے حل کو فروغ دینا۔\"",
    "about": "جناب آغا ظفر احمد پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے صدر اور سپریم کورٹ آف پاکستان کے ایک ممتاز وکیل ہیں جن کا قانون کا تجربہ 21 سال سے زائد پر محیط ہے۔ وہ ایڈمرلٹی اور میری ٹائم لاء، تجارتی تنازعات، بین الاقوامی تجارت کے معاملات اور متبادل حلِ تنازعات (ADR) میں اپنی مہارت کے لیے بڑے پیمانے پر جانے جاتے ہیں۔ پی ایم اے کے بانی رکن کی حیثیت سے، وہ پاکستان بھر میں ثالثی اور پرامن حلِ تنازعات کے طریقوں کو آگے بڑھانے میں اہم کردار ادا کر رہے ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈیٹر)", "سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "ماسٹر ٹرینر", "ایگزیکٹو لیڈرشپ"],
    "expertise": ["تجارتی تنازعات", "میری ٹائم اور ایڈمرلٹی لاء", "بین الاقوامی تجارتی تنازعات", "کارپوریٹ ثالثی", "سول قانونی چارہ جوئی", "متبادل حلِ تنازعات (ADR)"],
    "experience": { "years": "21+ سال", "label": "قانون کی پریکٹس اور تنازعات کا حل" },
    "accreditations": ["سی ای ڈی آر تسلیم شدہ ثالث (لندن)", "ایم آئی سی اے ڈی آر (MICADR) پینل ثالث", "پی ایم اے تسلیم شدہ ثالث", "بین الاقوامی ثالثی قانون میں ڈپلومہ"],
    "education": ["بین الاقوامی ثالثی قانون میں ڈپلومہ – کالج آف لاء، انگلینڈ اور ویلز"],
    "affiliations": ["SUPREME COURT BAR ASSOCIATION OF PAKISTAN", "SINDH HIGH COURT BAR ASSOCIATION", "پاکستان میڈیٹرز ایسوسی ایشن (بانی رکن)", "بحریہ یونیورسٹی (سابق وزٹنگ فیکلٹی)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "سائمہ امین خواجہ",
    "role": "نائب صدر – نارتھ",
    "highlight": "\"تعلیم اور ادارہ جاتی قیادت کے ذریعے قانونی اصلاحات، ثالثی کی فضیلت، اور پائیدار حلِ تنازعات کو فروغ دینا۔\"",
    "about": "محترمہ سائمہ امین خواجہ پاکستان میڈیٹرز ایسوسی ایشن (PMA) کی نائب صدر (نارتھ) اور ایک مایہ ناز قانونی پیشہ ور ہیں جنہیں کارپوریٹ قانونی چارہ جوئی، آئینی قانون، اور قانونی اصلاحات کی مشاورت کا وسیع تجربہ حاصل ہے۔ وہ ایک بین الاقوامی سطح پر تربیت یافتہ ثالث اور ماسٹر ٹرینر ہیں جو پاکستان میں اے ڈی آر، ماحولیاتی قانون اور پیشہ ورانہ قانونی تعلیم کو آگے بڑھانے کے لیے پرعزم ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈیٹر)", "سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "ماسٹر ٹرینر", "ٹریننگ کمیٹی"],
    "expertise": ["کارپوریٹ قانونی چارہ جوئی", "آئینی قانون", "قانونی اصلاحات اور مشاورت", "ماحولیاتی قانون", "ثالثی اور اے ڈی آر ٹریننگ", "کلائمیٹ چینج پالیسی"],
    "experience": { "years": "20+ سال", "label": "قانون کی پریکٹس، ٹریننگ اور کنسلٹنسی" },
    "accreditations": ["سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "سی ای ڈی آر ماسٹر ٹرینر", "پی ایم اے تسلیم شدہ ثالث", "ماحولیاتی قانون کی تربیت – ایم سی مہتا فاؤنڈیشن، انڈیا"],
    "education": ["ایل ایل ایم (LL.M) – کنگز کالج لندن"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن", "کلائمیٹ چینج کمیشن – لاہور ہائی کورٹ", "سول سروسز اکیڈمی", "جوڈیشل اکیڈمی", "LAHORE UNIVERSITY OF MANAGEMENT SCIENCES (LUMS)", "یونیورسٹی کالج لاہور (UCL)", "دی انسٹی ٹیوٹ آف لیگل اسٹڈیز (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "اسفند یار علی خان",
    "role": "نائب صدر – نارتھ",
    "highlight": "\"قیادت، تربیت اور ادارہ جاتی مہارت کے ذریعے ثالثی، ثالثی (آربٹریشن) اور قانونی اصلاحات کو آگے بڑھانا۔\"",
    "about": "بیریسٹر اسفند یار علی خان پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے نائب صدر (نارتھ) اور اس تنظیم کے بانی رکن ہیں۔ لنکنز ان کی معزز سوسائٹی کی طرف سے بار میں بلائے گئے، وہ قانون اور ترقی کے ایک ماہر پیشہ ور ہیں جنہیں ثالثی، آربٹریشن، ماحولیاتی قانون اور ریگولیٹری معاملات میں وسیع مہارت حاصل ہے۔ وہ پاکستان بھر میں اے ڈی آر کے طریقوں اور قانونی اصلاحات کے اقدامات کو مضبوط بنانے میں بڑھ چڑھ کر حصہ لیتے ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈیٹر)", "سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "ماسٹر ٹرینر", "ضابطہ اخلاق کمیٹی"],
    "expertise": ["آربٹریشن اور اے ڈی آر", "لیبر اور ایمپلائمنٹ لاء", "ماحولیاتی قانون", "خاندانی اور اراضی کے تنازعات", "ریگولیٹری امور", "ثالثی کی تربیت"],
    "experience": { "years": "20+ سال", "label": "قانون کی پریکٹس، اے ڈی آر اور ٹریبیونل قیادت" },
    "accreditations": ["سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "سی ای ڈی آر ماسٹر ٹرینر", "ممبر – چارٹرڈ انسٹی ٹیوٹ آف آربٹریٹرز (MCIArb)، لندن", "پی ایم اے تسلیم شدہ ثالث"],
    "education": ["پوسٹ گریجویٹ ڈپلومہ ان پروفیشنل لیگل اسکلز – یوکے", "ایل ایل بی (Hons) – یوکے", "ایم فل – پاکستان", "ایم اے – پاکستان", "بی اے – پاکستان"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (بانی رکن)", "چارٹرڈ انسٹی ٹیوٹ آف آربٹریٹرز، لندن", "خیبر پختونخوا انوائرنمنٹل پروٹیکشن ٹریبیونل", "لنکنز ان، لندن"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "وجیہہ علیم",
    "role": "سیکرٹری جنرل",
    "highlight": "\"پاکستان میں ایک مضبوط اے ڈی آر فریم ورک کے لیے قیادت، جدت طرازی، اور بین الاقوامی تعاون کے ذریعے ثالثی کو آگے بڑھانا۔\"",
    "about": "محترمہ وجیہہ علیم پاکستان میڈیٹرز ایسوسی ایشن (PMA) کی سیکرٹری جنرل کے طور پر خدمات انجام دے رہی ہیں، اور پاکستان بھر میں ثالثی کو مضبوط بنانے اور متبادل حلِ تنازعات (ADR) کو ادارہ جاتی شکل دینے پر مرکوز اسٹریٹجک اقدامات کی قیادت کر رہی ہیں۔ 17 سال سے زائد کارپوریٹ اور قانونی تجربے کے ساتھ، وہ جدت، پالیسی اصلاحات، عدالتی تعاون اور بین الاقوامی شراکت داری کے ذریعے ثالثی کو ایک معتبر، قابل رسائی اور عالمی سطح پر ہم آہنگ طریقہ کار بنانے کے لیے کوشاں ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈیٹر)", "سی ای ڈی آر (CEDR) تسلیم شدہ ثالث", "ماسٹر ٹرینر", "ایگزیکٹو لیڈرشپ"],
    "expertise": ["متبادل حلِ تنازعات (ADR)", "کارپوریٹ اور قانونی مشاورت", "ثالثی کی تربیت", "ادارہ جاتی ترقی", "پالیسی اصلاحات", "بین الاقوامی اے ڈی آر تعاون"],
    "experience": { "years": "17+ سال", "label": "کارپوریٹ، قانونی اور اے ڈی آر لیڈرشپ" },
    "accreditations": ["سی ای ڈی آر یوکے تصدیق شدہ ثالث", "پی ایم اے تسلیم شدہ ثالث", "بین الاقوامی اے ڈی آر پریکٹیشنر"],
    "education": ["ایل ایل ایم (LL.M) – یونائیٹڈ کنگڈم", "بی اے، ایل ایل بی (Hons) – جامعہ کراچی"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن", "بین الاقوامی اے ڈی آر اور میڈی ایشن نیٹ ورکس", "عدالتی اور ادارہ جاتی اے ڈی آر اقدامات"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"قیادت، وکالت اور اے ڈی آر کی مہارت کے ذریعے ثالثی اور بین الاقوامی تنازعات کے حل کو آگے بڑھانا۔\"",
    "about": "آغا ظفر احمد سپریم کورٹ آف پاکستان کے ایک ممتاز وکیل، تسلیم شدہ ثالث، اور سینئر اے ڈی آر پیشہ ور ہیں جنہیں ایڈمرلٹی اور میری ٹائم لاء، سول قانونی چارہ جوئی، تجارتی تنازعات، اور بین الاقوامی تجارتی امور میں وسیع مہارت حاصل ہے۔ پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے صدر کی حیثیت سے، وہ ثالثی کے طریقوں کو مضبوط بنانے اور پاکستان میں ادارہ جاتی تنازعات کے حل کے فریم ورک کو فروغ دینے میں کلیدی کردار ادا کر رہے ہیں۔\n\nوہ ایک سی ای ڈی آر (CEDR UK) تسلیم شدہ ثالث ہیں اور ہائی کورٹ آف سندھ کے پینل پر بطور ثالث خدمات انجام دیتے ہیں جبکہ مصالحہ انٹرنیشنل سینٹر فار اے ڈی آر (MICADR) سے بھی وابستہ ہیں۔ اپنی قانونی پریکٹس کے علاوہ، انہوں نے ایک وزٹنگ فیکلٹی ممبر اور ادارہ جاتی رہنما کے طور پر قانونی تعلیم اور پیشہ ورانہ ترقی میں حصہ ڈالا ہے۔",
    "badges": ["ماسٹر ٹرینر", "صدر", "ایگزیکٹو لیڈرشپ"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "تجارتی تنازعات کا حل", "ایڈمرلٹی اور میری ٹائم لاء", "بین الاقوامی تجارتی تنازعات", "آربٹریشن اور تنازعات کا حل", "سول اور کارپوریٹ قانونی چارہ جوئی", "ٹرین دی ٹرینر (TOT)"],
    "experience": { "years": "21+ سال", "label": "قانون کی پریکٹس اور تنازعات کا حل" },
    "accreditations": ["سی ای ڈی آر یوکے تسلیم شدہ ثالث", "پینل میڈیٹر – ہائی کورٹ آف سندھ", "ممبر – مصالحہ انٹرنیشنل سینٹر فار اے ڈی آر (MICADR)", "بین الاقوامی ثالثی قانون میں ڈپلومہ – انگلینڈ اور ویلز"],
    "education": ["بین الاقوامی ثالثی قانون میں ڈپلومہ – کالج آف لاء، انگلینڈ اور ویلز"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "مصالحہ انٹرنیشنل سینٹر فار اے ڈی آر (MICADR)", "ہائی کورٹ آف سندھ", "سپریم کورٹ بار ایسوسی ایشن آف پاکستان", "سندھ ہائی کورٹ بار ایسوسی ایشن", "بحریہ یونیورسٹی"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "مستنصر ذاکر",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"اسٹریٹجک قیادت اور اے ڈی آر کی فضیلت کے ذریعے کارپوریٹ گورننس اور ثالثی کی تربیت کے اقدامات کی قیادت کرنا۔\"",
    "about": "مستنصر ذاکر ایک سینئر کارپوریٹ رہنما، تسلیم شدہ ثالث، اور بین الاقوامی سطح پر تسلیم شدہ اے ڈی آر ٹرینر ہیں جنہیں اسٹریٹجک مینجمنٹ, کارپوریٹ گورننس اور تنازعات کے حل کا وسیع تجربہ حاصل ہے۔ وہ پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے ڈائریکٹر ٹریننگ اور ایگزیکٹو ممبر کے طور پر خدمات انجام دیتے ہیں اور انہوں نے پاکستان بھر میں ثالثی اور اے ڈی آر کی آگاہی کو فروغ دینے میں نمایاں کردار ادا کیا ہے۔\n\nوہ آئی سی اے پی (ICAP)، آئی سی ایم اے پی (ICMAP)، اور آئی سی ایس پی (ICSP) کے فیلو ممبر ہیں، اور اس وقت ہاشو گروپ کے ساتھ بطور چیف ایگزیکٹو کام کر رہے ہیں۔ انہوں نے کارنیل یونیورسٹی، امریکہ سے اسٹریٹجک مینجمنٹ سرٹیفیکیشن اور پاکستان انسٹی ٹیوٹ آف کارپوریٹ گورننس سے سرٹیفائیڈ ڈائریکٹر ایجوکیشن مکمل کی ہے۔ ایک سی ای ڈی آر یوکے تسلیم شدہ ثالث اور ماسٹر ٹرینر کی حیثیت سے، انہوں نے پاکستان میں پیشہ ورانہ ثالثی کی تربیت، قیادت کی ترقی، اور ادارہ جاتی اے ڈی آر اقدامات میں بڑے پیمانے پر تعاون کیا ہے۔",
    "badges": ["ماسٹر ٹرینر", "ڈائریکٹر ٹریننگ", "ایگزیکٹو کمیٹی – ساؤتھ", "سابق صدر"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "کارپوریٹ گورننس", "اسٹریٹجک مینجمنٹ", "ایگزیکٹو لیڈرشپ ڈویلپمنٹ", "تجارتی تنازعات کا حل", "ٹرین دی ٹرینر (TOT)", "ادارہ جاتی صلاحیتوں کی تعمیر"],
    "experience": { "years": "20+ سال", "label": "ایگزیکٹو لیڈرشپ اور اے ڈی آر ٹریننگ" },
    "accreditations": ["سی ای ڈی آر یوکے تسلیم شدہ ثالث", "سی ای ڈی آر یوکے ماسٹر ٹرینر", "سرٹیفائیڈ ڈائریکٹر – پاکستان انسٹی ٹیوٹ آف کارپوریٹ گورننس", "اسٹریٹجک مینجمنٹ سرٹیفیکیشن – کارنیل یونیورسٹی، امریکہ"],
    "education": ["فیلو – انسٹی ٹیوٹ آف چارٹرڈ اکاؤنٹنٹس آف پاکستان (ICAP)", "فیلو – انسٹی ٹیوٹ آف کاسٹ اینڈ مینجمنٹ اکاؤنٹنٹس آف پاکستان (ICMAP)", "فیلو – انسٹی ٹیوٹ آف کارپوریٹ سیکرٹریز آف پاکستان (ICSP)"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "ہاشو گروپ", "پاکستان ہوٹلز ایسوسی ایشن (PHA)", "ایسوسی ایشن آف بلڈرز اینڈ ڈویلپرز آف پاکستان (ABAD)", "انسٹی ٹیوٹ آف چارٹرڈ اکاؤنٹنٹس آف پاکستان (ICAP)", "پاکستان انسٹی ٹیوٹ آف کارپوریٹ گورننس", "کراچی سی اسکاؤٹ کونسل ٹرسٹ"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "وجیہہ علیم",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"پاکستان میں ایک مضبوط اے ڈی آر فریم ورک کے لیے قیادت، جدت طرازی، اور بین الاقوامی تعاون کے ذریعے ثالثی کو آگے بڑھانا۔\"",
    "about": "وجیہہ علیم ہائی کورٹ کی وکیل، تسلیم شدہ ثالث، اور قانونی پیشہ ور ہیں جنہیں کارپوریٹ آپریشنز، قانونی مشاورت، اور متبادل حلِ تنازعات (ADR) کا وسیع تجربہ حاصل ہے۔ وہ اس وقت پاکستان میڈیٹرز ایسوسی ایشن (PMA) کی سیکرٹری جنرل کے طور پر خدمات انجام دے رہی ہیں اور ساتھ ہی ہاشو گروپ میں جنرل مینیجر (آپریشنز اور لیگل) کے عہدے پر فائز ہیں۔\n\nانہوں نے یونائیٹڈ کنگڈم سے انٹرنیشنل کمرشل لاء اینڈ متبادل حلِ تنازعات (ADR) میں ایل ایل ایم کیا ہے اور وہ ایک سی ای ڈی آر تسلیم شدہ ثالث ہیں جن کی بین الاقوامی وابستگیوں میں تھائی لینڈ آربٹریشن سینٹر (THAC) شامل ہے۔ وہ ہائی کورٹ آف سندھ میں بطور ثالث پینل میں شامل ہیں اور قومی اور بین الاقوامی سطح پر معروف قانونی اور پیشہ ورانہ تنظیموں کے ساتھ سرگرم عمل ہیں۔",
    "badges": ["ماسٹر ٹرینر", "سیکرٹری جنرل", "ایگزیکٹو لیڈرشپ"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "بین الاقوامی تجارتی قانون", "کارپوریٹ قانونی مشاورت", "تجارتی تنازعات کا حل", "ادارہ جاتی اے ڈی آر ترقی", "پیشہ ورانہ مہارتوں کی تربیت", "تنازعات کا حل"],
    "experience": { "years": "17+ سال", "label": "کارپوریٹ، قانونی اور اے ڈی آر لیڈرشپ" },
    "accreditations": ["سی ای ڈی آر تسلیم شدہ ثالث", "پینل میڈیٹر – ہائی کورٹ آف سندھ", "ایسوسی ایٹ ٹرینر – پی ایم اے", "ٹی ایچ اے سی (THAC) چیپٹر وابستگی – تھائی لینڈ آربٹریشن سینٹر"],
    "education": ["انٹرنیشنل کمرشل لاء اور اے ڈی آر میں ایل ایل ایم – یونائیٹڈ کنگڈم", "بی اے، ایل ایل بی (Hons) – پاکستان"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "ثائی لینڈ آربٹریشن سینٹر (THAC)", "ہائی کورٹ آف سندھ", "سندھ بار کونسل", "کراچی بار ایسوسی ایشن", "INTERNATIONAL BAR ASSOCIATION", "ہاشو گروپ"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "ہما شاہ",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"قیادت، وکالت اور پیشہ ورانہ رہنمائی کے ذریعے کارپوریٹ قانونی فضیلت اور ثالثی کی تربیت کو آگے بڑھانا۔\"",
    "about": "ہما شاہ ایک انتہائی تجربہ کار قانونی پیشہ ور، کارپوریٹ مشیر، اور تسلیم شدہ اے ڈی آر ٹرینر ہیں جن کی قانونی پریکٹس تین دہائیوں سے زیادہ پر محیط ہے۔ 1993 سے، انہوں نے پاکستان کے چند ممتاز ترین قانونی اداروں بشمول اے جی ایچ ایس (AGHS) لیگل ایڈ سیل، محترمہ عاصمہ جہانگیر اور محترمہ ہنا جیلانی کے ماتحت اے جی ایچ ایس لاء ایسوسی ایٹس، اور میسرز سروج اینڈ بیچینو کے ساتھ کام کیا ہے۔\n\nوہ میسرز شیخ شاہ رانا اینڈ اعجاز (SSR&I) میں مینیجنگ پارٹنر کے طور پر خدمات انجام دے چکی ہیں اور اس وقت ایچ بی ایل (HBL) میں لیگل ہیڈ – نارتھ کے طور پر خدمات انجام دے رہی ہیں۔ وہ بار کونسل آف انگلینڈ اینڈ ویلز کی انز آف کورٹ ایڈوکیسی کمیٹی (IATC) کے تحت ایڈوکیسی ٹریننگ پروگرام پاکستان کی ایک تسلیم شدہ ٹرینر ہیں، اور ایک سی ای ڈی آر یوکے تسلیم شدہ ثالث اور ماسٹر ٹرینر ہیں۔",
    "badges": ["ماسٹر ٹرینر", "ایگزیکٹو کمیٹی – نارتھ", "ٹریننگ کمیٹی"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "کارپوریٹ اور تجارتی قانون", "ایڈوکیسی اور قانونی مہارتوں کی تربیت", "معاہدہ کی ڈرافٹنگ اور ویٹنگ", "بینکنگ اور کارپوریٹ قانونی مشاورت", "تنازعات کا حل", "ٹرین دی ٹرینر (TOT)"],
    "experience": { "years": "30+ سال", "label": "قانونی پریکٹس، کارپوریٹ ایڈوائزری اور اے ڈی آر ٹریننگ" },
    "accreditations": ["سی ای ڈی آر یوکے تسلیم شدہ ثالث", "سی ای ڈی آر یوکے ماسٹر ٹرینر", "تسلیم شدہ ٹرینر – ایڈوکیسی ٹریننگ پروگرام پاکستان (IATC)"],
    "education": ["پنجاب لاء کالج – تعلیمی میرٹ کے لیے دو بار گولڈ میڈل سے نوازا گیا"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "انز آف کورٹ ایڈوکیسی کمیٹی (IATC)", "بار کونسل آف انگلینڈ اینڈ ویلز", "حبیب بینک لمیٹڈ (HBL)", "پنجاب بار ایسوسی ایشنز", "اے جی ایچ ایس لیگل ایڈ سیل", "میسرز سروج اینڈ بیچینو"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "عثمان جی راشد",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"پاکستان بھر میں اے ڈی آر کی صلاحیت پیدا کرنے کے لیے قانونی وکالت، ثالثی کی مہارت، اور تربیتی leadership کو یکجا کرنا۔\"",
    "about": "عثمان جی راشد ایک بیرسٹر ایٹ لاء، ہائی کورٹس کے وکیل، سی ای ڈی آر تسلیم شدہ ثالث، اور ماسٹر ٹرینر ہیں جنہیں قانونی پریکٹس، ایڈوکیسی ٹریننگ، ثالثی اور قانونی تعلیم کا وسیع تجربہ حاصل ہے۔ انہوں نے یونیورسٹی آف لندن سے ایل ایل بی (Hons)، کنگز کالج لندن سے ایل ایل ایم کیا، اور یونیورسٹی آف دی ویسٹ آف انگلینڈ، برسٹل، یوکے سے بار ووکیشنل کورس مکمل کیا۔ انہیں آنرایبل سوسائٹی آف لنکنز ان کی طرف سے بار میں بلایا گیا تھا۔\n\nوہ اس سے قبل پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے سیکرٹری جنرل کے طور پر خدمات انجام دے چکے ہیں اور انہوں نے پاکستان میں ثالثی کی آگاہی، اے ڈی آر کی صلاحیت سازی، اور پیشہ ورانہ قانونی تربیت کے اقدامات میں بڑھ چڑھ کر حصہ لیا ہے۔ اپنی قانونی پریکٹس کے ساتھ ساتھ، وہ قانونی تعلیم اور وکالت کی تربیت سے واسطہ رکھتے ہیں، خاص طور پر یونیورسٹی آف لندن کے ایکسٹرنل پروگرام کے لیے کمپنی لاء اور لاء آف ایویڈنس پڑھاتے ہیں۔\n\nعثمان نے اپنے پیشہ ورانہ کیریئر کا آغاز عمر بندیال اینڈ ایسوسی ایٹس سے کیا اور اس وقت عنایت اللہ چیمبرز، ایڈووکیٹس اینڈ لیگل کنسلٹنٹس کے ذریعے اپنی قانونی پریکٹس کا انتظام سنبھالتے ہیں۔ قانونی چارہ جوئی، اے ڈی آر، قانونی تعلیم، اور ایڈوکیسی ٹریننگ میں ان کی مشترکہ مہارت انہیں ادارہ جاتی اے ڈی آر کی ترقی اور پیشہ ورانہ ثالثی کے طریقوں میں مؤثر طریقے سے تعاون کرنے کے قابل بناتی ہے۔",
    "badges": ["ماسٹر ٹرینر", "بیرسٹر ایٹ لاء", "سابق سیکرٹری جنرل – پی ایم اے"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "ایڈوکیسی اسکلز ٹریننگ", "کمپنی لاء", "قانونِ شہادت (Law of Evidence)", "تجارتی اور سول قانونی چارہ جوئی", "قانونی تعلیم اور پیشہ ورانہ ترقی", "تنازعات کا حل"],
    "experience": { "years": "15+ سال", "label": "سی ای ڈی آر تسلیم شدہ ماسٹر ٹرینر، ایڈوکیسی اور قانونی تعلیم" },
    "accreditations": ["سی ای ڈی آر تسلیم شدہ ثالث اور ماسٹر ٹرینر – یوکے", "بیرسٹر ایٹ لاء – لنکنز ان", "سرٹیفائیڈ ایڈوکیسی ٹرینر"],
    "education": ["ایل ایل ایم – کنگز کالج، یونیورسٹی آف لندن", "ایل ایل بی (Hons) – یونیورسٹی آف لندن", "بار ووکیشنل کورس – یونیورسٹی آف دی ویسٹ آف انگلینڈ، برسٹل، یوکے۔"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "معزز سوسائٹی آف لنکنز ان", "یونیورسٹی کالج لاہور", "یونیورسٹی آف لندن ایکسٹرنل پروگرام", "عنایت اللہ چیمبرز، ایڈووکیٹس اینڈ لیگل کنسلٹنٹس"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "اسفند یار علی خان",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"قیادت، تربیت اور ادارہ جاتی مہارت کے ذریعے ثالثی، آربٹریشن اور قانونی اصلاحات کو آگے بڑھانا۔\"",
    "about": "اسفند یار علی خان ایک سینئر قانونی پریکٹیشنر، تسلیم شدہ ثالث، اور بین الاقوامی سطح پر تربیت یافتہ اے ڈی آر ماہر ہیں جنہیں قانونی مشاورت، آربٹریشن، ادارہ جاتی ترقی، اور ثالثی کی تربیت کا وسیع تجربہ حاصل ہے۔ ایس اینڈ کے پارٹنرشپ میں سینئر پارٹنر اور پاکستان میڈیٹرز ایسوسی ایشن (PMA) کے نائب صدر کی حیثیت سے، وہ پاکستان میں ثالثی اور متبادل حلِ تنازعات کے فریم ورک کو مضبوط بنانے میں فعال طور پر حصہ لیتے ہیں۔\n\nلنکنز ان، لندن کی طرف سے بار میں بلائے گئے، وہ ایک سی ای ڈی آر یوکے تسلیم شدہ ثالث اور ماسٹر ٹرینر ہیں اور چارٹرڈ انسٹی ٹیوٹ آف آربٹریٹرز (MCIArb)، لندن کے ممبر ہیں۔ ان کا پیشہ ورانہ پس منظر قانونی پریکٹس، بین الاقوامی ترقیاتی اقدامات، پالیسی روابط، اور ادارہ جاتی مشاورتی کرداروں پر محیط ہے بشمول اقوام متحدہ اور یو این ڈی پی (UNDP) کے منصوبوں کے ساتھ کام۔",
    "badges": ["ماسٹر ٹرینر", "ایگزیکٹو لیڈرشپ", "نائب صدر – نارتھ"],
    "expertise": ["اے ڈی آر اور ثالثی کی تربیت", "آربٹریشن اور تنازعات کا حل", "تجارتی اور سول تنازعات", "قانونی مہارتوں کی ترقی", "ادارہ جاتی اے ڈی آر صلاحیت سازی", "پیشہ ورانہ ترقی کے پروگرام", "ٹرین دی ٹرینر (TOT)"],
    "experience": { "years": "20+ سال", "label": "قانون کی پریکٹس، اے ڈی آر اور ٹریبیونل قیادت" },
    "accreditations": ["سی ای ڈی آر یوکے تسلیم شدہ ثالث", "سی ای ڈی آر یوکے ماسٹر ٹرینر", "ممبر – چارٹرڈ انسٹی ٹیوٹ آف آربٹریٹرز (MCIArb)، لندن", "بیرسٹر ایٹ لاء – لنکنز ان، لندن"],
    "education": ["پوسٹ گریجویٹ ڈپلومہ ان پروفیشنل لیگل اسکلز – یوکے", "ایل ایل بی (Hons) – یوکے", "ایم اے – پاکستان", "بی اے – پاکستان"],
    "affiliations": ["پاکستان میڈیٹرز ایسوسی ایشن (PMA)", "سی ای ڈی آر یوکے", "چارٹرڈ انسٹی ٹیوٹ آف آربٹریٹرز, لندن", "لنکنز ان، لندن", "پاکستان ریڈ کریسنٹ سوسائٹی (PRCS)", "پاکستان انوائرنمنٹل لاء ایسوسی ایشن", "برٹش ایلومنائی ایسوسی ایشن", "اقوام متحدہ کے ترقیاتی اقدامات"],
    "media": []
  },
   "trainer_saima_amin_khawaja": {
    "name": "سائمہ امین خواجہ",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"تعلیم اور ادارہ جاتی قیادت کے ذریعے قانونی اصلاحات، ثالثی کی فضیلت، اور پائیدار تنازعات کے حل کو فروغ دینا۔\"",
    "about": "سائمہ امین خواجہ ایک مایہ ناز قانونی پیشہ ور، منظور شدہ ثالث (میڈی ایٹر)، اور بین الاقوامی سطح پر تربیت یافتہ ADR ماہر ہیں جو کارپوریٹ قانونی چارہ جوئی، آئینی قانون، قانونی مشاورت، اور ادارہ جاتی اصلاحات میں وسیع تجربہ رکھتی ہیں۔ انہوں نے پاکستان میں ثالثی کی آگاہی، ADR ٹریننگ، اور قانونی ترقی کے اقدامات کو آگے بڑھانے میں اہم کردار ادا کیا ہے۔\n\nانہوں نے کنگز کالج لندن سے LL.M کیا ہے اور ایم سی مہتا فاؤنڈیشن، انڈیا سے ماحولیاتی قوانین میں خصوصی تربیت حاصل کی ہے۔ ایک CEDR UK تسلیم شدہ ثالث اور ماسٹر ٹرینر کے طور پر، انہوں نے پیشہ ورانہ ثالثی کی تربیت اور صلاحیتوں کو بڑھانے کے پروگراموں میں بڑھ چڑھ کر حصہ لیا ہے۔ انہوں نے لمز (LUMS)، سول سروسز اکیڈمی، جوڈیشل اکیڈمی، TILS اور UCL میں پڑھایا ہے، جبکہ لاہور ہائی کورٹ کی جانب سے قائم کردہ کلائمیٹ چینج کمیشن میں بھی خدمات انجام دی ہیں۔",
    "badges": ["ماسٹر ٹرینر", "ایگزیکٹو ممبر", "وائس پریسیڈنٹ – نارتھ"],
    "expertise": ["ADR اور ثالثی کی تربیت", "کارپوریٹ اور آئینی قانون", "قانونی اصلاحات اور پالیسی کی ترقی", "ماحولیاتی قانون", "جوڈیشل اور پیشہ ورانہ تربیت", "تنازعات کا حل", "ٹرینر کی ٹریننگ (TOT)"],
    "experience": { "years": "20+ سال", "label": "قانونی پریکٹس، ٹریننگ اور کنسلٹنسی" },
    "accreditations": ["CEDR UK منظور شدہ ثالث", "CEDR UK ماسٹر ٹرینر", "خصوصی ماحولیاتی قانون کی تربیت – ایم سی مہتا فاؤنڈیشن، انڈیا"],
    "education": ["LL.M – کنگز کالج لندن"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن (PMA)", "CEDR UK", "لاہور ہائی کورٹ", "لاہور یونیورسٹی آف مینجمنٹ سائنسز (LUMS)", "سول سروسز اکیڈمی", "جوڈیشل اکیڈمی", "TILS", "UCL", "ایم سی مہتا فاؤنڈیشن، انڈیا"]
  },
  "trainer_tariq_saeed_rana": {
    "name": "طارق سعید رانا",
    "role": "ماسٹر ٹرینر",
    "highlight": "\"بین الاقوامی مہارت، پیشہ ورانہ تربیت، اور ADR قیادت کے ذریعے کارپوریٹ قانونی پریکٹس اور ثالثی کی فضیلت کی قیادت کرنا۔\"",
    "about": "طارق سعید رانا ایک سینئر قانونی مشیر، منظور شدہ ثالث، اور کارپوریٹ اور کمرشل قانون میں وسیع مہارت رکھنے والے بین الاقوامی سطح پر تسلیم شدہ ADR ٹرینر ہیں۔ سوسائٹی آف لنکنز ان، یوکے کی جانب سے بار میں بلائے جانے کے بعد، وہ اس وقت Surridge & Beecheno میں کارپوریٹ اور کمرشل لا ڈویژن کے سربراہ ہیں اور پاکستان میں ثالثی کی تربیت، قانونی مشاورت، اور ادارہ جاتی ADR کی ترقی میں نمایاں کردار ادا کر رہے ہیں۔\n\nوہ ایک CEDR UK تسلیم شدہ ثالث اور ماسٹر ٹرینر ہیں جنہیں کارپوریٹ گورننس، قانونی مشاورت، اور پیشہ ورانہ صلاحیتوں کی تعمیر میں وسیع تجربہ ہے۔ وہ قانونی اور تجارتی اداروں میں قائدانہ کردار برقرار رکھتے ہوئے پیشہ ورانہ اور ڈائریکٹرز کے تربیتی پروگراموں کو فعال طور پر چلاتے ہیں۔",
    "badges": ["ماسٹر ٹرینر", "سابق صدر", "ایگزیکٹو کمیٹی – نارتھ"],
    "expertise": ["ADR اور ثالثی کی تربیت", "کارپوریٹ اور کمرشل قانون", "ڈائریکٹرز کے تربیتی پروگرام", "کارپوریٹ گورننس", "تجارتی تنازعات کا حل", "پیشہ ورانہ قانونی ترقی", "ٹرینر کی ٹریننگ (TOT)"],
    "experience": { "years": "25+ سال", "label": "قانونی پریکٹس، ADR اور کارپوریٹ ایڈوائزری" },
    "accreditations": ["CEDR UK منظور شدہ ثالث", "CEDR UK ماسٹر ٹرینر", "کالڈ ٹو دی بار – لنکنز ان، یوکے"],
    "education": ["LL.M. ان کمرشل لاز – برطانیہ", "پوسٹ گریجویٹ ڈپلومہ ان لا – برطانیہ", "LL.B – پاکستان", "ایسوسی ایٹ انجینئرنگ (مکینیکل) – پاکستان"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن (PMA)", "CEDR UK", "سوسائٹی آف لنکنز ان، لندن", "جنرل کونسل آف دی بار آف انگلینڈ اینڈ ویلز", "لاہور ہائی کورٹ بار ایسوسی ایشن", "پنجاب بار کونسل", "لاہور چیمبر آف کامرس اینڈ انڈسٹری", "Surridge & Beecheno"]
  },
  "saeed_habib": {
    "name": "سعید حبیب",
    "role": "وائس پریسیڈنٹ – ساؤتھ",
    "highlight": "",
    "about": "",
    "badges": ["ممبرشپ کمیٹی", "ادارہ جاتی ہم آہنگی"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "shabana_ali": {
    "name": "شبانہ علی",
    "role": "وائس پریسیڈنٹ – ساؤتھ",
    "highlight": "\"وکالت، تعلیم اور تنازعات کے حل کے ذریعے ثالثی، قانونی بیداری اور سماجی انصاف کو فروغ دینا۔\"",
    "about": "محترمہ شبانہ علی پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) کی وائس پریسیڈنٹ - ساؤتھ ہیں اور ایک تجربہ کار سول، ٹیکس اور کارپوریٹ وکیل ہیں جو قانونی چارہ جوئی، مشاورتی خدمات اور تنازعات کے حل میں مضبوط پس منظر رکھتی ہیں۔ وہ پاکستان میں ثالثی کے طریقوں کو آگے بڑھانے میں سرگرم عمل ہیں اور قانونی بااختیار بنانے، سماجی انصاف اور خواتین و بچوں کے حقوق کے تحفظ کے لیے اپنے عزم کی وجہ سے بڑے پیمانے پر جانی جاتی ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈی ایٹر)", "PMA منظور شدہ ثالث", "بار کوآرڈینیشن – ساؤتھ", "قیادت"],
    "expertise": ["سول لا", "کارپوریٹ لا", "خاندانی تنازعات", "ٹیکس لا", "ثالثی اور ADR", "خواتین اور بچوں کے حقوق کی وکالت"],
    "experience": { "years": "20+ سال", "label": "قانونی پریکٹس، ثالثی اور عوامی وکالت" },
    "accreditations": ["PMA منظور شدہ ثالث", "سرٹیفائیڈ میڈیشن پریکٹیشنر"],
    "education": ["سول، کارپوریٹ اور ٹیکس قانون میں قانونی اور پیشہ ورانہ تعلیم"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن", "پاکستان انسٹی ٹیوٹ آف پبلک فنانس اکاؤنٹنٹس (PIPFA)", "ایگزیکٹو کمیٹی – PMA", "میڈیا لیگل اینالسٹ اور اسپیکر"]
  },
  "syed_sammad_ul_haque": {
    "name": "سید صمد الحق",
    "role": "فنانس سیکریٹری",
    "highlight": "",
    "about": "",
    "badges": ["ممبرشپ کمیٹی", "ایگزیکٹو قیادت"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "tariq_saeed_rana": {
  "name": "طارق سعید رانا",
  "role": "ایگزیکٹو کمیٹی – نارتھ",
  "highlight": "\"بین الاقوامی مہارت، پیشہ ورانہ تربیت، اور ADR قیادت کے ذریعے کارپوریٹ قانونی پریکٹس اور ثالثی کی فضیلت کی قیادت کرنا۔\"",
  "about": "بیرسٹر طارق سعید رانا ایک سینئر قانونی پیشہ ور، منظور شدہ ثالث (میڈی ایٹر)، اور کارپوریٹ اور کمرشل قانون میں وسیع مہارت رکھنے والے ماسٹر ٹرینر ہیں۔ سوسائٹی آف لنکنز ان، یوکے کی جانب سے بار میں بلائے جانے کے بعد، وہ اس وقت Surridge & Beecheno میں کارپوریٹ اور کمرشل لا ڈویژن کے سربراہ ہیں۔ قانونی مشاورت، ADR، اور پیشہ ورانہ تربیت میں دہائیوں کے تجربے کے ساتھ، وہ پاکستان میں ثالثی اور ادارہ جاتی قانونی ترقی کو آگے بڑھانے میں اہم قائدانہ کردار ادا کر رہے ہیں۔",
  "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈی ایٹر)", "CEDR منظور شدہ ثالث", "ماسٹر ٹرینر", "سابق صدر"],
  "expertise": ["کارپوریٹ اور کمرشل قانون", "ثالثی اور ADR", "بین الاقوامی تجارتی تنازعات", "قانونی مشاورت", "کارپوریٹ governance", "پیشہ ورانہ تربیت"],
  "experience": { "years": "25+ سال", "label": "قانونی پریکٹس، ADR اور کارپوریٹ ایڈوائزری" },
  "accreditations": ["CEDR منظور شدہ ثالث", "CEDR ماسٹر ٹرینر", "کالڈ ٹو دی بار – لنکنز ان، یوکے", "PMA منظور شدہ ثالث"],
  "education": ["LL.M. (کمرشل لاز) – برطانیہ", "پوسٹ گریجویٹ ڈپلومہ ان لا – برطانیہ", "LL.B. – پاکستان", "ایسوسی ایٹ انجینئرنگ (مکینیکل) – پاکستان"],
  "affiliations": ["جنرل کونسل آف دی بار آف انگلینڈ اینڈ ویلز", "سوسائٹی آف لنکنز ان، لندن", "پاکستان میڈی ایٹرز ایسوسی ایشن", "لاہور ہائی کورٹ بار ایسوسی ایشن", "پنجاب bar کونسل", "لاہور چیمبر آف کامرس اینڈ انڈسٹری"],
  "media": []
},
  "huma_shah": {
    "name": "ہما شاہ",
    "role": "ایگزیکٹو کمیٹی – نارتھ",
    "highlight": "\"قیادت، وکالت اور پیشہ ورانہ رہنمائی کے ذریعے کارپوریٹ قانونی عمدگی اور ثالثی کی تربیت کو فروغ دینا۔\"",
    "about": "محترمہ ہما شاہ ایک سینئر قانونی پیشہ ور ہیں جو کارپوریٹ قانون، قانونی مشاورت، تجارتی ڈرافٹنگ، اور تنازعات کے حل میں وسیع تجربہ رکھتی ہیں۔ 1993 سے پریکٹس کرتے ہوئے، انہوں نے نامور قانونی اداروں اور لاء فرموں بشمول AGHS لیگل ایڈ سیل, AGHS لا ایسوسی ایٹس، اور Surridge & Beecheno کے ساتھ کام کیا ہے۔ وہ اس وقت HBL میں لیگل ہیڈ - نارتھ کے طور پر خدمات انجام دے رہی ہیں اور پاکستان میں ثالثی کی تربیت اور ADR کی ترقی میں نمایاں کردار ادا کر رہی ہیں۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈی ایٹر)", "CEDR منظور شدہ ثالث", "ماسٹر ٹرینر", "ٹریننگ کمیٹی"],
    "expertise": ["کارپوریٹ اور کمرشل قانون", "قانونی مشاورت", "تجارتی ڈرافٹنگ اور ویٹنگ", "بینکنگ اور مالیاتی قانونی امور", "ثالثی اور ADR", "وکالت کی تربیت"],
    "experience": { "years": "30+ سال", "label": "قانونی پریکٹس، کارپوریٹ ایڈوائزری اور ADR ٹریننگ" },
    "accreditations": ["CEDR منظور شدہ ثالث", "CEDR ماسٹر ٹرینر", "منظور شدہ ایڈووکیسی ٹرینر – IATC (بار کونسل آف انگلینڈ اینڈ ویلز)", "PMA منظور شدہ ثالث"],
    "education": ["پنجاب لا کالج - گولڈ میڈلسٹ (تعلیمی میرٹ کے لیے دو بار ایوارڈ یافتہ)"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن", "انز آف کورٹ ایڈووکیسی ٹریننگ پروگرام پاکستان", "پنجاب بار ایسوسی ایشنز", "HBL – لیگل ہیڈ نارتھ"]
  },
  "umaimah_anwar_khan": {
    "name": "امیمہ انور خان",
    "role": "ایگزیکٹو کمیٹی – ساؤتھ",
    "highlight": "",
    "about": "",
    "badges": ["ضابطہ اخلاق", "بار کوآرڈینیشن – ساؤتھ"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "mustansir_zakir": {
    "name": "مستنصر ذاکر",
    "role": "ایگزیکٹو کمیٹی – ساؤتھ",
    "highlight": "\"اسٹریٹجک قیادت اور ADR کی فضیلت کے ذریعے کارپوریٹ گورننس اور ثالثی کے تربیتی اقدامات کی قیادت کرنا۔\"",
    "about": "جناب مستنصر ذاکر ایک سینئر کارپئیوٹ ایگزیکٹو، منظور شدہ ثالث، اور ماسٹر ٹرینر ہیں جنہیں کارپوریٹ گورننس، ہاسپیٹلٹی، فنانس، اور متبادل تنازعات کے حل (ADR) میں وسیع قائدانہ تجربہ حاصل ہے۔ فی الوقت ہاشو گروپ میں چیف ایگزیکٹو کے طور پر خدمات انجام دے رہے ہیں، انہوں نے پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) کے اندر اپنی قیادت کے ذریعے پاکستان میں ثالثی کی آگاہی اور پیشہ ورانہ تربیتی اقدامات کو آگے بڑھانے میں اہم کردار ادا کیا ہے۔",
    "badges": ["ایگزیکٹو ٹیم", "ثالث (میڈی ایٹر)", "CEDR منظور شدہ ثالث", "ڈائریکٹر ٹریننگ", "ماسٹر ٹرینر", "سابق صدر"],
    "expertise": ["کارپوریٹ گورننس", "اسٹریٹجک مینجمنٹ", "ثالثی اور ADR ٹریننگ", "ہاسپیٹلٹی اور کاروباری قیادت", "مالیاتی انتظام", "ادارہ جاتی ترقی"],
    "experience": { "years": "30+ سال", "label": "کارپوریٹ قیادت، گورننس اور ADR" },
    "accreditations": ["CEDR منظور شدہ ثالث", "CEDR ماسٹر ٹرینر", "سرٹیفائیڈ ڈائریکٹر ایجوکیشن – PICG", "اسٹریٹجک مینجمنٹ سرٹیفیکیشن – کارنیل یونیورسٹی، امریکہ"],
    "education": ["فیلو – انسٹی ٹیوٹ آف چارٹرڈ اکاؤنٹنٹس آف پاکستان (ICAP)", "فیلو – انسٹی ٹیوٹ آف کاسٹ اینڈ مینجمنٹ اکاؤنٹنٹس آف پاکستان (ICMAP)", "فیلو – انسٹی ٹیوٹ آف کارپوریٹ سیکریٹریز آف پاکستان (ICSP)"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن (سابق صدر اور ڈائریکٹر ٹریننگ)", "ہاشو گروپ – چیف ایگزیکٹو", "پاکستان ہوٹلز ایسوسی ایشن (سابق چیئرمین)", "ایسوسی ایشن آف بلڈرز اینڈ ڈویلپرز آف پاکستان (ABAD)", "کراچی سی اسکاؤٹ کونسل ٹرسٹ – منیجنگ ٹرسٹی"]
  },
  "usman_g_rashid": {
    "name": "عثمان جی راشد",
    "role": "ممبر",
    "highlight": "\"پاکستان بھر میں ADR کی صلاحیت پیدا کرنے کے لیے قانونی وکالت، ثالثی کی مہارت، اور تربیتی قیادت کو یکجا کرنا۔\"",
    "about": "عثمان جی راشد ایک بیرسٹر ایٹ لا، ہائی کورٹس کے ایڈوکیٹ، CEDR منظور شدہ ثالث، اور ماسٹر ٹرینر ہیں جنہیں قانونی پریکٹس، وکالت کی تربیت، ثالثی اور قانونی تعلیم میں وسیع تجربہ ہے۔ انہوں نے یونیورسٹی آف لندن سے LL.B (Hons)، کنگز کالج لندن سے LL.M کیا، اور یونیورسٹی آف دی ویسٹ آف انگلینڈ، برسٹل، یوکے سے بار ووکیشنل کورس مکمل کیا۔ انہیں آنریبل سوسائٹی آف لنکنز ان کی جانب سے بار میں بلایا گیا تھا۔\n\nوہ اس سے قبل پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) کے سیکرٹری جنرل کے طور پر خدمات انجام دے چکے ہیں اور انہوں نے پاکستان میں ثالثی کی آگاہی، ADR کی صلاحیتوں کی تعمیر، اور پیشہ ورانہ قانونی تربیت کے اقدامات میں فعال کردار ادا کیا ہے۔ اپنی قانونی پریکٹس کے ساتھ ساتھ، وہ قانونی تعلیم اور وکالت کی تربیت، خاص طور پر یونیورسٹی آف لندن ایکسٹرنل پروگرام کے لیے کمپنی لا اور لا آف ایویڈنس سے وابستہ ہیں۔\n\nعثمان نے اپنے پیشہ ورانہ کیریئر کا آغاز عمر بندیال اینڈ ایسوسی ایشنز سے کیا اور فی الوقت عنایت اللہ چیمبرز، ایڈووکیٹس اینڈ لیگل کنسلٹنٹس کے ذریعے اپنی قانونی پریکٹس چلا رہے ہیں۔",
    "badges": ["ثالث (میڈی ایٹر)", "ماسٹر ٹرینر", "بیرسٹر ایٹ لا"],
    "expertise": ["ADR اور ثالثی کی تربیت", "وکالت کی مہارت کی تربیت", "کمپنی لا", "قانونِ شہادت (Law of Evidence)", "تجارتی اور سول قانونی چارہ جوئی", "قانونی تعلیم اور پیشہ ورانہ ترقی", "تنازعات کا حل"],
    "experience": { "years": "", "label": "CEDR منظور شدہ ثالث اور ماسٹر ٹرینر" },
    "accreditations": ["CEDR منظور شدہ ثالث اور ماسٹر ٹرینر – یوکے", "بیرسٹر ایٹ لا – لنکنز ان", "سرٹیفائیڈ ایڈووکیسی ٹرینر"],
    "education": ["LL.M. – کنگز کالج، یونیورسٹی آف لندن", "LL.B. (Hons.) – یونیورسٹی آف لندن", "بار ووکیشنل کورس – یونیورسٹی آف دی ویسٹ آف انگلینڈ، برسٹل، یوکے"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن (PMA)", "CEDR UK", "آنریبل سوسائٹی آف لنکنز ان", "یونیورسٹی کالج لاہور", "یونیورسٹی آف لندن ایکسٹرنل پروگرام", "عنایت اللہ چیمبرز، ایڈووکیٹس اینڈ لیگل کنسلٹنٹس"]
  },
  "adnan_mufti": {
    "name": "عدنان مفتی",
    "role": "ایگزیکٹو کمیٹی – ساؤتھ",
    "highlight": "",
    "about": "",
    "badges": ["ادارہ جاتی ہم آہنگی", "قیادت"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": []
  },
  "anwar_kashif_mumtaz": {
    "name": "انور کاشف ممتاز",
    "role": "ماسٹر ٹرینر",
    "highlight": "",
    "about": "انور کاشف ممتاز ایک سینئر قانونی پیشہ ور، لیڈرشپ ٹرینر، اور منظور شدہ ثالث ہیں جنہیں کارپوریٹ، ٹیکس، اور تنازعات کے حل کی پریکٹس میں وسیع تجربہ حاصل ہے۔ ہائی کورٹ کے ایڈوکیٹ اور میسرز سید الدین اینڈ کمپنی میں سینئر پارٹنر کے طور پر، انہوں نے پاکستان میں ٹیکس اور کارپوریٹ لا ایڈوائزری میں ایک مضبوط ساکھ بنائی ہے۔\n\nوہ لیڈرشپ اور پرسنل ڈویلپمنٹ میں بین الاقوامی سطح پر سرٹیفائیڈ ٹرینر اور CEDR UK کے منظور شدہ ثالث اور ماسٹر ٹرینر ہیں۔ انہوں نے قانونی اور کارپوریٹ سیکٹرز میں لیڈرشپ کی ترقی، ثالثی کی آگاہی، اور پیشہ ورانہ صلاحیتوں کی تعمیر میں نمایاں کردار ادا کیا ہے۔ انہوں نے پاکستان ٹیکس بار اور کراچی ٹیکس بار کے سیکرٹری جنرل، نائب صدر اور صدر سمیت اہم قائدانہ عہدوں پر بھی خدمات انجام دی ہیں۔",
    "badges": ["ماسٹر ٹرینر", "سابق صدر", "لیڈرشپ ٹرینر"],
    "expertise": ["لیڈرشپ اور پرسنل ڈویلپمنٹ", "ADR اور ثالثی کی تربیت", "کارپوریٹ لا", "ٹیکس لا اور ایڈوائزری", "پیشہ ورانہ ترقی کے پروگرام", "تنازعات کا حل", "ٹرینر کی ٹریننگ (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["CEDR UK منظور شدہ ثالث", "CEDR UK ماسٹر ٹرینر", "سرٹیفائیڈ انٹرنیشنل ٹرینر – لیڈرشپ اور پرسنل ڈویلپمنٹ"],
    "education": ["ایڈوکیٹ، ہائی کورٹ آف پاکستان"],
    "affiliations": ["پاکستان میڈی ایٹرز ایسوسی ایشن (PMA)", "CEDR UK", "پاکستان ٹیکس بار", "کراچی ٹیکس بار", "پبلک انٹرسٹ لا ایسوسی ایشن آف پاکستان (PILAP)", "میسرز سید الدین اینڈ کمپنی"]
  }
  },
          
          "former_presidents": {
            "president_1": {
              "name": "انور کاشف ممتاز",
              "title": "سابق صدر"
            },
            "president_2": {
              "name": "مستنصر ذاکر",
              "title": "سابق صدر"
            },
            "president_3": {
              "name": "طارق سعید رانا",
              "title": "سابق صدر"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "ذیلی کمیٹی",
              "subtitle": "ہماری ذیلی کمیٹیاں مہارت، باہمی تعاون اور انتھک محنت کے ذریعے اہم اقدامات کو آگے بڑھاتی ہیں اور PMA کے مشن کو سپورٹ کرتی ہیں۔",
              "expand_all": "سب کھولیں"
            },
            "labels": {
              "mandate": "مینڈیٹ:",
              "director": "ڈائریکٹر",
              "convener": "کنوینر"
            },
            "committees": {
              "training": {
                "title": "ٹریننگ کمیٹی",
                "mandate": "اورینٹیشن، ٹریننگ، سرٹیفیکیشن/ایکرایڈیشن/ریفریشر کورسز/ٹرین دی ٹرینر (TOT)",
                "lead_name": "مستنصر ذاکر",
                "members": [
                  "انور کاشف ممتاز",
                  "سائمه خواجہ",
                  "طارق رانا",
                  "ہما شاہ",
                  "اسفند یار علی خان"
                ]
              },
              "conduct": {
                "title": "ضابطہ اخلاق کمیٹی",
                "mandate": "ثالثوں کے لیے ضابطہ اخلاق کا مسودہ تیار کرنا اور ملک بھر میں اس کے نفاذ کے لیے وزارت قانون سے منظوری حاصل کرنے کی مہم چلانا۔",
                "lead_name": "امیمہ خان",
                "members": [
                  "انور کاشف ممتاز",
                  "سائمه خواجہ",
                  "خالد محمود",
                  "عدنان مفتی",
                  "طارق رانا",
                  "اسفند یار علی خان"
                ]
              },
              "membership": {
                "title": "رکنیت کمیٹی",
                "mandate": "پرانی رکنیت کو برقرار رکھنا اور فعال کرنا، دوسرے اداروں کے تسلیم شدہ ثالثوں کو مدعو کر کے ممبرشپ پورٹ فولیو کو بڑھانا اور اس کے ساتھ ساتھ ایسوسی ایٹ اور اعزازی ممبران کو شامل کرنا۔",
                "lead_name": "سعید حبیب",
                "members": [
                  "خالد محمود",
                  "سائمه خواجہ",
                  "صمد الحق",
                  "اسفند یار علی خان"
                ]
              },
              "bar_south": {
                "title": "قانونی اور تعلیمی ہم آہنگی - جنوب",
                "mandate": "میٹنگز، سیمینارز، اورینٹیشنز اور ٹریننگ/ورکشاپس کے انعقاد کے لیے بار ایسوسی ایشن/بار کونسل اور لاء اسکولوں کے ساتھ ہم آہنگی۔",
                "lead_name": "شبانہ علی",
                "members": [
                  "سعادت یار خان",
                  "امیمہ خان",
                  "محترمہ خالد محمود",
                  "صمد الحق",
                  "منصور میر",
                  "نوید احمد"
                ]
              },
              "bar_north": {
                "title": "قانونی اور تعلیمی ہم آہنگی - شمال",
                "mandate": "میٹنگز، سیمینارز، اورینٹیشنز اور ٹریننگ/ورکشاپس کے انعقاد کے لیے بار ایسوسی ایشن/بار کونسل اور لاء اسکولوں کے ساتھ ہم آہنگی۔",
                "lead_name": "سائمه خواجہ",
                "members": [
                  "ظفر کلانوری",
                  "بیرسٹر طارق رانا",
                  "اسفند یار علی خان"
                ]
              },
              "institutional": {
                "title": "ادارتی ہم آہنگی کمیٹی",
                "mandate": "چیمبرز، تجارتی اداروں، پیشہ ورانہ انجمنوں/اداروں کے ساتھ ہم آہنگی۔",
                "lead_name": "عدنان مفتی",
                "members": [
                  "مستنصر ذاکر",
                  "سعید حبیب",
                  "طارق رانا",
                  "اسفند یار علی خان",
                  "صمد الحق"
                ]
              }
            },
            "footer_note": "آغا ظفر احمد (صدر) اور وجیہہ علیم (سیکرٹری جنرل) ہر کمیٹی کے ایکس آفیشیو (Ex. Officio) ممبر ہیں۔"
          },
          "mediators": {
            "adnan-mufti": { "name": "عدنان مفتی", "role": "رکن" },
            "anwar-kashif-mumtaz": { "name": "انور کاشف ممتاز", "role": "رکن" },
            "ayesha-sarfraz-ali-khan": { "name": "عائشہ سرفراز علی خان", "role": "رکن" },
            "barrister-tariq-saeed-lahore": { "name": "بیرسٹر طارق سعید", "role": "رکن" },
            "farrukh-junaidy": { "name": "فرخ جنیدی", "role": "رکن" },
            "huma-shah": { "name": "ہما شاہ", "role": "رکن" },
            "ishtiaq-memon": { "name": "اشتیاق میمن", "role": "رکن" },
            "isfandyar-ali-khan": { "name": "اسفند یار علی خان", "role": "رکن" },
            "khalid-firoz-arfeen": { "name": "خالد فیروز عارفین", "role": "رکن" },
            "khalid-mahmood-siddiqui": { "name": "خالد محمود صدیقی", "role": "رکن" },
            "mohammad-rehan-siddqui": { "name": "محمد ریحان صدیقی", "role": "رکن" },
            "mustansir-zakir": { "name": "مستنصر ذاکر", "role": "رکن" },
            "nausheen-ahmed": { "name": "نوشین احمد", "role": "رکن" },
            "neelofar-hameed": { "name": "نیلوفر حمید", "role": "رکن" },
            "omair-nisar-khan": { "name": "عمیر نثار خان", "role": "رکن" },
            "raheem-hasnani": { "name": "رحیم حسنانی", "role": "رکن" },
            "reshma-aftab": { "name": "ریشما آفتاب", "role": "رکن" },
            "rubina-virani": { "name": "روبینہ ویرانی", "role": "رکن" },
            "saadat-yar-khan": { "name": "سعادت یار خان", "role": "رکن" },
            "saeed-habib": { "name": "سعید حبیب", "role": "رکن" },
            "saima-khawaja": { "name": "سائمه امین خواجہ", "role": "رکن" },
            "salina-khalfan": { "name": "سالینہ خلفان", "role": "رکن" },
            "shabana-ali": { "name": "شبانہ علی", "role": "رکن" },
            "shaheen-premani": { "name": "شاہین پریمنی", "role": "رکن" },
            "syed-haider-imam-rizvi": { "name": "سید حیدر امام رضوی", "role": "رکن" },
            "syed-sammadul-haque": { "name": "سید صمد الحق", "role": "رکن" },
            "tahmasp-r-razvi": { "name": "طہماسپ آر رضوی", "role": "رکن" },
            "umaimah-a-rizvi": { "name": "امیمہ اے رضوی", "role": "رکن" },
            "usman-g-rashid": { "name": "عثمان جی راشد", "role": "رکن" },
            "wajiha-aleem": { "name": "وجیہہ علیم", "role": "رکن" },
            "yousuf-moulvi": { "name": "یوسف مولوی", "role": "رکن" },
            "zafar-kalanauri": { "name": "ظفر کلانوری", "role": "رکن" },
            "zia-makhdoom": { "name": "ضیاء مخدوم", "role": "رکن" }
          }

        },
        "resources_page": {
          "hero": {
            "image_alt": "سروسز ہیرو امیج",
            "eyebrow": "وسائل (RESOURCES)",
            "title_line1": "علم۔ قانون۔",
            "title_accent": "اصلاح۔",
            "lead_text": "پی ایم اے (PMA) کی مطبوعات، ثالثی کے قوانین، ادارہ جاتی دستاویزات، تحقیقی مقالات، وکالتی وسائل، اور میڈیا مواد تک رسائی حاصل کریں جو پاکستان میں اے ڈی آر (ADR) اور پرامن حلِ تنازعات کے فروغ میں معاون ہیں۔"
          },
          "tabs": {
            "featured": "نمایاں",
            "downloads": "ڈاؤن لوڈز",
            "mediation_laws": "ثالثی کے قوانین",
            "advocacy": "وکالت و حمایت (Advocacy)",
            "press_media": "پریس اور میڈیا",
            "articles": "مضامین"
          },
          "downloads_panel": {
            "header": {
              "title": "ڈاؤن لوڈز",
              "lead": "ڈاؤن لوڈ کے لیے پی ڈی ایف (PDFs)، فارمز اور مطبوعات۔ فائل کو نئے ٹیب میں کھولنے کے لیے اس پر کلک کریں۔",
              "view_all_text": "تمام ڈاؤن لوڈز دیکھیں"
            },
            "global_labels": {
              "download_btn_text": "ڈاؤن لوڈ پی ڈی ایف",
              "default_image_alt": "ADR-ACT-2017 پی ڈی ایف فائل"
            },
            "items": {
              "card_1": {
                "title": "اے ڈی آر ایکٹ 2017 (ADR-ACT-2017)",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "وکالت اور لابی (Advocacy and Lobby)",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "رجسٹریشن کا سرٹیفکیٹ",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "رکنیت کا درخواستی فارم",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "مفاہمت نامہ (میمورنڈم آف ایسوسی ایشن) اپڈیٹڈ",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "نامزدگی (Nomination)",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "پی ایم اے (PMA) تقریر",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "پی ایم اے میں کیوں شامل ہوں؟",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "ثالثی کے قوانین اور قانون سازی",
              "lead": "ثالثی سے متعلق اہم قوانین، بل اور سرکاری قانون سازی کی دستاویزات۔",
              "view_all_text": "تمام قوانین دیکھیں"
            },
            "global_labels": {
              "download_btn_text": "ڈاؤن لوڈ پی ڈی ایف",
              "default_image_alt": "ADR-ACT-2017 پی ڈی ایف فائل"
            },
            "items": {
              "card_1": {
                "title": "اسلام آباد ڈسپیوٹ ریزولوشن ایکٹ (ثالثی)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "ضابطہ دیوانی 1908 (CPC) کے پہلے شیڈول میں ترامیم",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "ضابطہ دیوانی 1908 میں پنجاب ترامیم (ثالثی کی شقیں)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "ڈرافٹ ضابطہ دیوانی (سندھ ترمیم) بل، 2018",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "ثالثی کے ذریعے تصفیوں پر سنگاپور کنونشن (متن)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "وکالت اور پالیسی (Advocacy & Policy)",
              "lead": "اے ڈی آر (ADR) اصلاحات کی حمایت کے لیے پالیسی بریفس، وکالتی ٹول کٹس اور پوزیشن پیپرز۔",
              "view_all_text": "تمام وکالتی مواد دیکھیں"
            },
            "global_labels": {
              "download_btn_text": "ڈاؤن لوڈ پی ڈی ایف",
              "default_image_alt": "ADR-ACT-2017 پی ڈی ایف فائل"
            },
            "items": {
              "card_1": {
                "title": "خیبر پختونخوا (KPK)",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "پنجاب",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "سندھ",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "پریس اور میڈیا",
              "lead": "صحافیوں کے لیے پریس ریلیز، میڈیا کٹس اور ڈاؤن لوڈ کے قابل مواد۔",
              "view_all_text": "میڈیا مواد دیکھیں"
            },
            "global_labels": {
              "download_btn_text": "ڈاؤن لوڈ پی ڈی ایف",
              "default_image_alt": "پی ڈی ایف فائل"
            },
            "items": {
              "card_1": {
                "title": "بزنس ریکارڈر (Business Recorder)",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "بزنس ریکارڈر اشتہار (AD)",
                "file_name": ""
              },
              "card_3": {
                "title": "فرنٹیئر پوسٹ (Frontier Post)",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "پاکستان آبزروور (Pakistan Observer)",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "پی ایم اے پریس ریلیز",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "ٹریبیون (Tribune)",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "مضامین اور تجزیہ",
              "lead": "ثالثی اور اے ڈی آر (ADR) پر تحقیقی مضامین، تجزیے اور فکری قیادت (Thought Leadership)۔",
              "view_all_text": "تمام مضامین دیکھیں"
            },
            "global_labels": {
              "download_btn_text": "ڈاؤن لوڈ پی ڈی ایف",
              "author_prefix": "بذریعہ"
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "جواد اے سروانہ",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "It Really Happened in Frankfurt پی ڈی ایف"
              },
              "card_2": {
                "title": "Mediation Techniques (ثالثی کی تکنیکیں)",
                "author": "جواد اے سروانہ",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "Mediation Techniques پی ڈی ایف"
              }
            }
          },
          "search_bar": {
            "question": "کیا آپ کو اپنی مطلوبہ چیز نہیں مل رہی؟",
            "subtext": "وسائل کو تیزی سے تلاش کرنے کے لیے سرچ کا استعمال کریں یا کیٹیگری کے لحاظ سے براؤز کریں۔",
            "placeholder": "وسائل تلاش کریں...",
            "browse_btn_text": "تمام وسائل براؤز کریں"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "ایونٹس",
            "title": "ایونٹس و تقاریب",
            "lead": "پی ایم اے (PMA) کی کانفرنسوں، ثالثی کے اقدامات، ورکشاپس اور اہم اعلانات سے باخبر رہیں۔",
            "image_alt": "ایونٹس ہیرو"
          },
          "tab_bar": {
            "upcoming_events": "آنے والے ایونٹس",
            "past_events": "گزشتہ ایونٹس",
            "announcements": "اعلانات"
          },
          "upcoming_panel": {
            "title": "بہت جلد آرہا ہے",
            "lead": "آنے والے ایونٹس، کانفرنسیں اور ورکشاپس یہاں درج کی جائیں گی۔ جلد ہی دوبارہ چیک کریں۔"
          },
          "announcements_panel": {
            "title": "بہت جلد آرہا ہے",
            "lead": "اہم اعلانات یہاں ظاہر کیے جائیں گے۔ ہمارے ساتھ جڑے رہیں۔"
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "گزشتہ ایونٹ",
                "pill_text": "سرٹیفائیڈ ٹریننگ پروگرام",
                "view_gallery_btn": "ایونٹ گیلری دیکھیں",
                "about_label": "ایونٹ کے بارے میں",
                "highlights_label": "تربیت کی اہم جھلکیاں"
              },
              "card": {
                "title": "چھٹا سرٹیفائیڈ میڈی ایشن ٹریننگ پروگرام",
                "sub": "سندھ ہائی کورٹ",
                "date": "08 جون 2026 سے 12 جون 2026",
                "location": "سندھ ہائی کورٹ، کراچی"
              },
              "about_paragraphs": [
                "پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) نے سندھ ہائی کورٹ میں چھٹے سرٹیفائیڈ میڈی ایشن ٹریننگ پروگرام کا کامیابی سے انعقاد کیا۔",
                "اس پروگرام کا مقصد ثالثی کی مہارتوں کو مضبوط کرنا، متبادل تنازعات کے حل (ADR) کے طریقوں کو فروغ دینا، اور قانونی ماہرین اور ثالثی کے پیشہ ور افراد میں پیشہ ورانہ صلاحیتوں کو بڑھانا تھا۔",
                "انٹرایکٹو سیشنز، عملی مشقوں اور باہمی بات چیت کے ذریعے، شرکاء نے جدید ثالثی کی تکنیکوں اور تنازعات کے حل کے فریم ورک کے بارے میں قیمتی معلومات حاصل کیں‌۔"
              ],
              "highlights": [
                "سرٹیفائیڈ ثالثی تربیتی سیشنز",
                "عملی ثالثی کی مشقیں",
                "انٹرایکٹو گروپ ڈسکشنز",
                "متبادل تنازعات کے حل (ADR) کی تکنیکیں",
                "پیشہ ورانہ صلاحیتوں کی تعمیر",
                "باہمی سیکھنے کا ماحول"
              ],
              "meta": {
                "objective_label": "تربیت کا مقصد",
                "objective_text": "ثالثی کی مہارتوں کو مضبوط کرنا اور تنازعات کے موثر حل کے طریقوں کو فروغ دینا۔",
                "organized_label": "منتظم",
                "organized_text": "پاکستان میڈی ایٹرز ایسوسی ایشن (PMA)",
                "participants_label": "شرکاء",
                "participants_text": "قانونی پیشہ ور افراد، اے ڈی آر (ADR) کے ماہرین، ثالثین اور زیر تربیت شرکاء۔",
                "type_label": "ایونٹ کی قسم",
                "type_text": "سرٹیفائیڈ ٹریننگ پروگرام"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "گزشتہ ایونٹ",
                "about_label": "ایونٹ کے بارے میں",
                "highlights_label": "نمایاں اے ڈی آر (ADR) پیش رفت"
              },
              "card": {
                "title": "ثالثی: آگے بڑھنے کا راستہ (Mediation A Way Forward)",
                "sub": "پہلی نیشنل میڈی ایشن کانفرنس",
                "date": "7 مارچ، 2015",
                "location": "ہوٹل میریٹ، کراچی",
                "type": "نیشنل کانفرنس"
              },
              "about_paragraphs": [
                "پی ایم اے (PMA) پاکستان کی پہلی تنظیم ہے جو بیرون ملک سے تربیت یافتہ اور منظور شدہ ثالثوں کے ساتھ ساتھ دیگر پیشہ ور افراد کی نمائندگی کرتی ہے جنہوں نے ایسوسی ایشن کے مقصد کو آگے بڑھانے کے لیے اس میں شمولیت اختیار کی ہے۔ یہ ایسوسی ایشن 2013 میں قائم کی گئی تھی اور اس نے متعدد ایسی سرگرمیاں اپنے ہاتھ میں لی ہیں جو پہلے آئی ایف سی/ورلڈ بینک گروپ کے متبادل تنازعات کے حل (ADR) پروجیکٹ کے تحت نافذ کی جا رہی تھیں۔",
                "اس بات کو مدنظر رکھتے ہوئے کہ پاکستان میں معاہدوں کے نفاذ کے اشارے حوصلہ افزا نہیں ہیں اور اس میں کئی سال اور بھاری لاگت آتی ہے، پی ایم اے ان اقدامات کی قیادت اور تعاون کا عزم رکھتی ہے جو فریقین کو دوستانہ ماحول اور ثالثی کے عمل کے ذریعے تنازعات کو حل کرنے کے قابل بنائیں گے، اور تنازعات کے بروقت حل میں عدلیہ اور عدالتوں کی کوششوں کا ساتھ دیں گے۔"
              ],
              "highlights": [
                "کراچی میں 'کراچی سینٹر فار ڈسپیوٹ ریزولوشن' اور لاہور میں 'لاہور چیمبر آف کامرس اینڈ انڈسٹری میڈی ایشن سینٹر' کا فعال ہونا۔",
                "پاکستان میں اے ڈی آر/ثالثی کے قوانین میں اصلاحات کے لیے کوششیں کرنا۔",
                "پاکستان میں CEDR کے منظور شدہ ثالثوں اور ماسٹر ٹرینرز کی موجودگی۔",
                "پاکستان میں اے ڈی آر (ADR) کا نصاب تیار کرنا۔",
                "پاکستان میں اے ڈی آر ٹریننگز کو مضبوط بنانا اور فراہم کرنا۔",
                "کارپوریٹ گورننس سمیت متعدد تنازعات کو حل کرنے کے لیے اے ڈی آر کو ایک ذریعہ کے طور پر تسلیم کرنا۔"
              ],
              "meta": {
                "objective_label": "کانفرنس کے مقاصد",
                "objective_text": "اے ڈی آر اور ثالثی کے مقصد کو آگے بڑھانا اور پاکستان میں ثالثی کو ادارہ جاتی شکل دینے کے لیے پیش رفت، چیلنجز اور مستقبل کے اقدامات پر بحث کرنا۔",
                "organized_label": "کانفرنس کے میزبان",
                "organized_text": "اس کانفرنس کی میزبانی پاکستان میڈی ایٹرز ایسوسی ایشن کانفرنس پارٹنرز کے تعاون سے کر رہی ہے۔",
                "participants_label": "مقررین اور مہمان",
                "participants_text": "حکومت، عدلیہ، کاروباری برادری، بار، تعلیمی اداروں اور پاکستان میں ثالثی کے مراکز کے نمائندے بشمول غیر ملکی مقررین۔",
                "type_label": "ایونٹ کی قسم",
                "type_text": "نیشنل کانفرنس"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "پرائیویسی",
            "title_accent": "پالیسی",
            "lead_text": "ہم آپ کی پرائیویسی کی حفاظت کرنے اور یہ یقینی بنانے کے لیے پرعزم ہیں کہ آپ کی ذاتی معلومات کو محفوظ اور ذمہ دارانہ طریقے سے سنبھالا جائے۔"
          },
          "sections": {
            "commitment": {
              "title": "پرائیویسی کا عزم",
              "paragraphs": [
                "پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) آن لائن آپ کی پرائیویسی کے تحفظ کے لیے پرعزم ہے۔ پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) نے پرائیویسی کے لیے اپنے پختہ عزم کا اظہار کرنے کے لیے یہ پرائیویسی بیان تیار کیا ہے۔ درج ذیل میں پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) کے لیے معلومات جمع کرنے اور پھیلانے کے طریقوں کو واضح کیا گیا ہے۔",
                "پی ایم اے کسی بھی وقت صارفین کو نئے پرائیویسی بیان کی موجودگی کے بارے میں مطلع کر کے اس پالیسی کو تبدیل کرنے کا حق محفوظ رکھتی ہے۔ یہ بیان اور اس میں بیان کردہ پالیسیاں کسی بھی فریق کے حق میں یا اس کی طرف سے کوئی معاہدہ یا دیگر قانونی حقوق پیدا کرنے کے لیے نہیں ہیں اور نہ ہی ایسا کرتی ہیں۔"
              ]
            },
            "respect_data": {
              "title": "صارف کے ڈیٹا کا احترام",
              "paragraphs": [
                "پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) اپنے کلائنٹس کے ساتھ مضبوط تعلقات کو انتہائی اہمیت دیتی ہے۔ پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) میں ڈیٹا جمع کرنے کے عمل کو ہمارے صارفین کی پرائیویسی کے مکمل اور مناسب احترام کے ساتھ سنبھالا جاتا ہے۔",
                "ہم جو ڈیٹا جمع کرتے ہیں اسے حساسیت، حفاظت اور پرائیویسی کے مناسب خیال کے ساتھ سنبھالا جاتا ہے۔ پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) اپنے کلائنٹس سے جمع کردہ ڈیٹا کو تیسرے فریقوں کے سامنے ظاہر نہیں کرتی، تقسیم نہیں کرتی اور نہ ہی فروخت کرتی ہے۔"
              ]
            },
            "collection": {
              "title": "معلومات کا حصول (ڈیٹا کلیکشن)",
              "lead_text": "پی ایم اے ممبرشپ سائن اپ کے لیے درج ذیل معلومات جمع کرتی ہے:",
              "items": [
                "کمپیوٹرائزڈ قومی شناختی کارڈ (CNIC)",
                "مکمل نام",
                "رہائشی پتہ",
                "دفتر کا پتہ",
                "فون نمبر",
                "ای میل کی معلومات",
                "رکنیت سے متعلق دیگر متعلقہ معلومات"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "شکایات اور اپیل",
            "title_accent": "پالیسی",
            "lead_text": "ہم شکایات اور تحفظات کو منصفانہ، فوری اور شفاف طریقے سے حل کرنے کے لیے پرعزم ہیں۔"
          },
          "intro_card": {
            "bold_text": "ہمارے پاس شکایات سے نمٹنے کے لیے ایک باقاعدہ طریقہ کار موجود ہے جو یہ یقینی بناتا ہے کہ ان پر مناسب توجہ اور دیکھ بھال کی جائے۔",
            "lead_p": "پی ایم اے (PMA) کی ثالثی ایکریڈیٹیشن سروسز کا کوئی بھی صارف شکایت درج کرا سکتا ہے۔ پی ایم اے کا مقصد تمام صارفین کو بروقت اور ذمہ دارانہ خدمات فراہم کرنا ہے۔ ہم:",
            "commitments": [
              "تمام شکایات کو سنجیدگی سے لیں گے اور ان سے مناسب طریقے سے نمٹیں گے؛",
              "شکایات کا فوری ازالہ کریں گے؛ اور",
              "شکایات سے سیکھیں گے اور اپنی خدمات کو بہتر بنانے کے لیے اقدامات کریں گے۔"
            ]
          },
          "steps": [
            {
              "text": "تاہم، ہم صرف ان شکایات پر کارروائی کر سکتے ہیں جو ڈائریکٹر آف ٹریننگ کی طرف سے موصول ہونے والی ناقص کسٹمر سروس کے بارے میں تحفظات پیدا کرتی ہوں۔"
            },
            {
              "text": "اس کا مطلب یہ ہے کہ آپ کا کیس ڈائریکٹر آف ٹریننگ کے نام ہونا چاہیے اور ڈاک اور ای میل کے ذریعے بھیجا جانا چاہیے، جس کی ایک کاپی (cc) صدر پی ایم اے کو بھیجی جائے۔"
            },
            {
              "text": "کوئی بھی طالب علم جو ڈائریکٹر آف ٹریننگ کے فیصلے سے مطمئن نہ ہو، وہ اس فیصلے کو مسترد کرنے کے لیے آزاد ہے، ایسی صورت میں اس کا کوئی لازم و ملزوم اثر نہیں ہوگا۔ ڈائریکٹر شکایت موصول ہونے کے 30 دنوں کے اندر جواب دینے کا پابند ہے۔"
            },
            {
              "text": "اگر، تاہم، آپ اپنی شکایت کے حل سے غیر مطمئن رہتے ہیں یا ڈائریکٹر آف ٹریننگ کی طرف سے کوئی جواب نہیں ملتا ہے، تو آپ اپنی شکایت صدر پی ایم اے کو بھیج سکتے ہیں جو آپ کی شکایت کی سماعت کے لیے دو رکنی فیکلٹی ٹریبونل قائم کریں گے۔"
            },
            {
              "text": "آپ کو اپنی درخواست کی وجوہات اور ڈائریکٹر آف ٹریننگ کے جائزے یا عدم کارروائی سے آپ کیا حاصل کرنا چاہتے ہیں، اس کے بارے میں واضح اور جامع ہونا پڑے گا۔ دو رکنی ٹریبونل صدر پی ایم اے کو کاپی کے ساتھ آپ کو تحریر کرے گا اور شکایت منتقلی کی درخواست کے 30 کاروباری دنوں کے اندر آپ کو تحریری طور پر یقینی جواب دے گا۔"
            },
            {
              "text": "اگر آپ اپنی شکایت پر دو رکنی ٹریبونل کی کارروائی یا عدم کارروائی سے مطمئن نہیں ہیں، تو اس سے کسی بھی فریق کے ریلیف کے لیے کنزیومر کورٹ (صارفین کی عدالت) سے رجوع کرنے کے حقوق متاثر نہیں ہوں گے، اور یہ آپشن سب کے لیے کھلا ہے۔"
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "شرائط و",
            "title_accent": "ضوابط",
            "lead_text": "براہ کرم ان شرائط کو غور سے پڑھیں۔ ہماری ویب سائٹ اور خدمات تک رسائی حاصل کرنے اور استعمال کرنے سے، آپ درج ذیل شرائط و ضوابط کی تعمیل کرنے سے اتفاق کرتے ہیں۔"
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "ٹریننگ (تربیت)",
              "preview": "اپنی بکنگ کی تصدیق کے لیے، آپ کی ادائیگی کورسز شروع ہونے سے پہلے؛ پیشگی ہمارے دفاتر تک پہنچنی چاہیے۔",
              "body_paragraphs": [
                "اگر صارف ادائیگی میں تاخیر کرتا ہے، تو اسے کورسز میں بیٹھنے کی اجازت نہیں دی جائے گی۔"
              ]
            },
            {
              "id": "refunds",
              "title": "ٹریننگ ریفنڈز (رقم کی واپسی)",
              "preview": "ہم سمجھتے ہیں کہ زندگی پیچیدہ ہو سکتی ہے۔ اگر آپ شرکت کرنے کے قابل نہیں ہیں، تو براہ کرم جلد از جلد ہم سے 9768-3452-021 پر رابطہ کریں یا ہمیں info@pma.org.pk پر ای میل کریں۔",
              "body_paragraphs": [
                "ہمیں آپ کی جگہ کسی متبادل شریک کو شامل کرنے، یا کریڈٹ یا ریفنڈ کا انتظام کرنے میں خوشی ہوگی اور ہم ہمیشہ انفرادی بنیادوں پر آپ کے کیس پر غور کریں گے۔"
              ]
            },
            {
              "id": "membership",
              "title": "رکنیت کی منسوخی",
              "preview": "خاص حالات کے علاوہ رکنیت کی فیس ناقابل واپسی ہے۔",
              "body_paragraphs": [
                "اگر آپ سمجھتے ہیں کہ آپ کے حالات استثنیٰ کے معیار پر پورا اترتے ہیں تو براہ کرم ہم سے رابطہ کریں۔ ہر کیس کا جائزہ انفرادی طور پر پی ایم اے کی ممبرشپ کمیٹی لیتی ہے۔"
              ]
            },
            {
              "id": "copyright",
              "title": "کاپی رائٹ (جملہ حقوق)",
              "preview": "یہ سائٹ اور اس کے مندرجات کاپی رائٹ کے تابع ہیں۔ سائٹ کے مواد کے کاپی رائٹ کی مالک پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) ہے، یا کچھ مواد کی صورت میں، کوئی تیسرا فریق ہے۔ سائٹ کے افعال اور آپریشنل کاپی رائٹ کی مالک پی ایم اے ہے۔",
              "body_paragraphs": [
                "آپ اپنے ویب براؤزر کا استعمال کرتے ہوئے اس سائٹ اور اس کے مندرجات کو دیکھ سکتے ہیں اور صرف ذاتی، غیر تجارتی استعمال کے لیے اس سائٹ کے حصوں کی الیکٹرانک کاپی اور ہارڈ کاپیاں پرنٹ کر سکتے ہیں۔ اس سائٹ کے مواد کا کوئی بھی دوسرا استعمال، بشمول دوبارہ تخلیق، ترمیم، تقسیم، منتقلی، دوبارہ اشاعت، نمائش یا کارکردگی، سختی سے ممنوع ہے۔"
              ]
            },
            {
              "id": "disclaimer",
              "title": "دستبرداری (Disclaimer)",
              "preview": "آپ اتفاق کرتے ہیں کہ اس سائٹ تک آپ کی رسائی اور استعمال ان شرائط اور تمام لاگو قوانین کے تابع ہے، اور یہ آپ کے اپنے خطرے پر ہے۔ یہ سائٹ اور اس کے مندرجات آپ کو \"جیسا ہے\" کی بنیاد پر فراہم کیے گئے ہیں، سائٹ میں غلطیاں، خامیاں اور خامیاں ہو سکتی ہیں اور ہو سکتا ہے کہ یہ مکمل اور موجودہ نہ ہو۔",
              "body_paragraphs": [
                "پاکستان میڈی ایٹرز ایسوسی ایشن (PMA) لاگو قوانین کے تحت فراہم کردہ سہولیات کے علاوہ، اس سائٹ کے آپریشن یا اس سائٹ پر شامل معلومات، مواد یا مصنوعات کے حوالے سے کسی بھی قسم کی صریح یا ضمنی ضمانت یا نمائندگی نہیں کرتی۔",
                "نہ تو پی ایم اے اور نہ ہی اس سے وابستہ ادارے، ڈائریکٹرز، افسران، ملازمین، ایجنٹ، ٹھیکیدار، جانشین یا تفویض کردہ افراد اس سائٹ اور اس سائٹ سے منسلک کسی دوسری سائٹ کے استعمال سے پیدا ہونے والے یا کسی بھی طرح سے متعلقہ نقصانات کے ذمہ دار ہوں گے۔ یہ حد براہ راست، بالواسطہ، نتیجہ خیز، خصوصی، تعزیری یا دیگر نقصانات پر لاگو ہوتی ہے جو آپ کو یا دوسروں کو پہنچ سکتے ہیں، نیز منافع کے نقصان، کاروبار میں رکاوٹ یا ڈیٹا یا معلومات کے نقصان کے نقصانات پر بھی لاگو ہوتی ہے۔"
              ]
            },
            {
              "id": "translations",
              "title": "گوگل تراجم (Google Translations)",
              "preview": "یہ ویب سائٹ آپ کی سہولت کے لیے گوگل ٹرانسلیٹ™ کے ذریعے ترجمہ کی گئی ہے۔ گوگل ٹرانسلیٹ™ کے تراجم ایک خودکار کمپیوٹرائزڈ عمل کے ذریعے کیے جاتے ہیں، کسی تصدیق شدہ پیشہ ور مترجم کے ذریعے نہیں۔",
              "body_paragraphs": [
                "اس وجہ سے، تراجم غلط یا ناقابل بھروسہ ہو سکتے ہیں۔ گوگل ٹرانسلیٹ™ کے تراجم احتیاط کے ساتھ استعمال کریں۔ تراجم کسی بھی قسم کی وارنٹی کے بغیر \"جیسا ہے\" کی بنیاد پر فراہم کیے جاتے ہیں۔ کچھ مواد (جیسے تصاویر، ویڈیوز، فلیش وغیرہ) ترجمے کے سافٹ ویئر کی حدود کی وجہ سے ترجمہ نہیں ہو پاتا۔",
                "پی ایم اے نامکمل یا غلط تراجم کی ذمہ دار نہیں ہے، اور نہ ہی وہ صارف کی طرف سے گوگل ٹرانسلیٹ™ کے تراجم (یا اس ویب سائٹ پر موجود کسی دوسرے ترجمے) کے استعمال سے پیدا ہونے والے کسی نقصان یا نقصان کی ذمہ دار ہے۔",
                "اگر آپ کے پاس گوگل ٹرانسلیٹ™ کے بارے میں کوئی سوالات ہیں، تو ملاحظہ کریں: Google Translate™ FAQs۔",
                "گوگل ترجمے سے متعلق تمام وارنٹیوں سے دستبردار ہوتا ہے، خواہ وہ صریح ہوں یا ضمنی، بشمول درستگی، قابل اعتمادی کی کوئی بھی وارنٹی، اور تجارتی قابلیت، کسی خاص مقصد کے لیے موزونیت اور خلاف ورزی نہ کرنے کی کوئی بھی ضمنی وارنٹی۔"
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "پی ایم اے جوائن کریں",
            "title_main": "بنیں ایک",
            "title_accent": "پی ایم اے ممبر",
            "lead_text": "ثالثوں (mediators)، اے ڈی آر (ADR) کے پیشہ ور افراد اور ادارہ جاتی رہنماؤں کی ایک مقتدر کمیونٹی میں شامل ہوں جو پرامن طریقے سے تنازعات کے حل کے لیے پرعزم ہیں۔"
          },
          "why_join": {
            "title_main": "پی ایم اے کیوں",
            "title_accent": "جوائن",
            "title_end": "کریں؟",
            "subtitle": "پی ایم اے کے ممبران پیشہ ورانہ فوائد اور مواقع کے ایک واضح سلسلے سے لطف اندوز ہوتے ہیں۔",
            "cards": [
              {
                "title": "بین الاقوامی کانفرنسیں",
                "description": "رعایتی فیس اور ترجیحی رجسٹریشن کے ساتھ ثالثی (mediation) اور پنچائیت (arbitration) کے جدید ترین مسائل پر عالمی کانفرنسوں میں شرکت کریں۔"
              },
              {
                "title": "ورکشاپس اور کورسز",
                "description": "اعلیٰ ترین تعلیمی ورکشاپس اور پیشہ ورانہ ترقی کے کورسز تک رسائی حاصل کریں۔"
              },
              {
                "title": "پیشہ ورانہ ترقی",
                "description": "ماہرین کی بصیرت اور وسائل کے ذریعے ثالثی (mediation) اور اے ڈی آر (ADR) کے بارے میں اپنی سمجھ کو بڑھائیں۔"
              },
              {
                "title": "عالمی نیٹ ورک",
                "description": "قیمتی قومی اور بین الاقوامی پیشہ ورانہ روابط قائم کریں اور انہیں برقرار رکھیں۔"
              },
              {
                "title": "کاروباری مواقع",
                "description": "اپنے کاروباری اور پیشہ ورانہ واقف کاروں کے حلقے کو وسیع کریں۔"
              },
              {
                "title": "پیشہ ورانہ تعاون",
                "description": "ثالثی اور پرامن تنازعات کے حل کی حمایت اور ترقی میں کلیدی کردار ادا کریں۔"
              }
            ]
          },
          "benefits": {
            "title_main": "رکنیت کے",
            "title_accent": "فوائد",
            "subtitle": "پی ایم اے کے ایک رجسٹرڈ ممبر کے طور پر، آپ فوائد اور مواقع کی ایک وسیع رینج سے لطف اندوز ہوں گے۔",
            "items": [
              {
                "title": "نیٹ ورکنگ کے مواقع",
                "description": "پورا سال، پی ایم اے ممبران کو پیشہ ورانہ تعلقات بڑھانے اور انڈسٹری کی سرگرمیوں اور رجحانات سے باخبر رہنے کے لیے مختلف مواقع فراہم کرتا ہے۔"
              },
              {
                "title": "ممبرشپ ڈائریکٹری",
                "description": "خصوصی طور پر پی ایم اے ممبران کے لیے دستیاب، اس ڈائریکٹری میں ممبران اور دیگر عالمی تنظیموں کے اپ ڈیٹ شدہ رابطے کی تفصیلات موجود ہیں۔ یہ پرنٹ اور الیکٹرانک دونوں صورتوں میں دستیاب ہے۔"
              },
              {
                "title": "ممبرشپ سرٹیفکیٹ",
                "description": "ممبران کو منظوری کے بعد عالمی سطح پر تسلیم شدہ ممبرشپ سرٹیفکیٹ جاری کیا جاتا ہے۔ سرٹیفکیٹس سالانہ ممبرز گالا میں دیے جاتے ہیں۔"
              },
              {
                "title": "مسلسل پیشہ ورانہ ترقی",
                "description": "ثالثی اور اے ڈی آر کے معروف ماہرین کی جانب سے انگریزی اور عربی میں منعقد کیے جانے والے خصوصی ورکشاپس اور پیشہ ورانہ ترقی کے کورسز تک ترجیحی رسائی۔"
              }
            ]
          },
          "membership_journey": {
            "title": "رکنیت کا سفر",
            "subtitle": "پی ایم اے کا ایک معزز رکن بننے کا ایک آسان عمل۔",
            "steps": [
              {
                "num": "1",
                "title": "رکنیت کا فارم جمع کروائیں",
                "desc": "آن لائن درخواست فارم پُر کریں۔"
              },
              {
                "num": "2",
                "title": "پروفائل کا جائزہ",
                "desc": "ہماری ٹیم آپ کی درخواست کا جائزہ لے گی۔"
              },
              {
                "num": "3",
                "title": "رکنیت کی منظوری",
                "desc": "آپ کی درخواست منظور ہونے کے بعد آپ کو مطلع کر دیا جائے گا۔"
              },
              {
                "num": "4",
                "title": "پی ایم اے میں خوش آمدید",
                "desc": "اپنا ممبرشپ سرٹیفکیٹ حاصل کریں اور ہمارے پیشہ ورانہ نیٹ ورک کا حصہ بنیں۔"
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "رکنیت کا فارم (درخواست)",
              "desc": "براہ کرم درست معلومات فراہم کریں۔ وہ تمام فیلڈز جن پر * کا نشان ہے لازمی ہیں۔"
            },
            "sections": {
              "personal_info": {
                "title": "ذاتی معلومات",
                "fields": {
                  "full_name": { "label": "پورا نام", "placeholder": "اپنا پورا نام درج کریں" },
                  "father_name": { "label": "والد کا نام", "placeholder": "والد کا نام درج کریں" },
                  "qualification": { "label": "تعلیمی قابلیت", "placeholder": "تعلیمی قابلیت درج کریں" },
                  "designation": { "label": "عہدہ", "placeholder": "عہدہ درج کریں" },
                  "cnic": { "label": "شناختی کارڈ نمبر (CNIC)", "placeholder": "شناختی کارڈ نمبر درج کریں" },
                  "chamber_phone": { "label": "چیمبر فون", "placeholder": "چیمبر کا فون نمبر درج کریں" }
                }
              },
              "contact_info": {
                "title": "رابطے کی معلومات",
                "fields": {
                  "office_address": { "label": "دفتر کا پتہ", "placeholder": "دفتر کا پتہ درج کریں" },
                  "res_address": { "label": "رہائشی پتہ", "placeholder": "رہائشی پتہ درج کریں" },
                  "res_phone": { "label": "گھر کا فون", "placeholder": "گھر کا فون نمبر درج کریں" },
                  "email": { "label": "ای میل", "placeholder": "ای میل ایڈریس درج کریں" },
                  "upload": {
                    "label": "دستاویزات اپ لوڈ کریں",
                    "text": "فائل منتخب کریں یا یہاں ڈریگ کریں",
                    "hint": "PDF, JPG, PNG (زیادہ سے زیادہ 5MB)"
                  }
                }
              },
              "references": {
                "title": "پیشہ ورانہ حوالہ جات (References)",
                "fields": {
                  "proposer_name": { "label": "تجوید کنندہ (Proposer) کا پورا نام", "placeholder": "پروپوزر کا پورا نام درج کریں" },
                  "proposer_address": { "label": "تجوید کنندہ کا رہائشی پتہ", "placeholder": "پتہ درج کریں" },
                  "proposer_phone": { "label": "تجوید کنندہ کا فون", "placeholder": "فون نمبر درج کریں" },
                  "seconder_name": { "label": "تائید کنندہ (Seconder) کا پورا نام", "placeholder": "سیکنڈر کا پورا نام درج کریں" },
                  "seconder_address": { "label": "تائید کنندہ کا رہائشی پتہ", "placeholder": "پتہ درج کریں" },
                  "seconder_phone": { "label": "تائید کنندہ کا فون", "placeholder": "فون نمبر درج کریں" }
                }
              }
            },
            "declaration": "میں اس بات کا اعلان کرتا/کرتی ہوں کہ اوپر فراہم کردہ معلومات سچی اور درست ہیں۔",
            "submit_btn": "درخواست جمع کروائیں",
            "sidebar": {
              "title_main": "مثبت تبدیلی کا",
              "title_accent": "حصہ بنیں",
              "desc": "پی ایم اے میں شامل ہوں اور مکالمے، افہام و تفہیم اور پرامن تنازعات کے حل کی ثقافت کو فروغ دینے میں اپنا کردار ادا کریں۔",
              "list": [
                "پیشہ ورانہ شناخت",
                "سیکھنا اور ترقی",
                "نیٹ ورکنگ اور تعاون",
                "اثر انگیز شراکت داری"
              ],
              "quote": "ہم مل کر ثالثی کے ذریعے ایک زیادہ ہم آہنگ اور انصاف پسند معاشرہ تشکیل دے سکتے ہیں۔",
              "author": "- پی ایم اے"
            }
          }
        }
      }
    },
    ar: {
      translation: {
        nav: {
          home: "الرئيسية",
          about: "عن PMA",
          mediation: "الوساطة",
          services: "الخدمات",
          training: "التدريب",
          leadership: "القيادة",
          resources: "الموارد",
          events: "الأحداث",
          contact: "اتصل بنا",
          membership: "كن عضواً"
        },
        hero: {
          title_part1: "تعزيز الحل السلمي",
          title_part2: "من خلال الحوار والتفاهم والاحترام",
          description1: "نحن ندعم الوساطة كبديل فعال وكفؤ وسري وتعاوني للتقاضي التقليدي.",
          description2: "من خلال الحوار المنظم والتسهيل المهني، نساعد الأفراد والعائلات والشركات والمؤسسات على حل النزاعات بشكل ودي — مع الحفاظ على العلاقات وتقليل الوقت والتكلفة والضغط النفسي.",
          btn_consult: "طلب استشارة مجانية",
          btn_training: "استكشف برامج التدريب"
        },
        features: {
          confidential_title: "سري وخاص",
          confidential_desc: "تظل مناقشاتك آمنة ومحمية بالكامل.",
          faster_title: "حل أسرع",
          faster_desc: "حل النزاعات في أيام أو أسابيع بدلاً من أشهر.",
          cost_title: "حل فعال من حيث التكلفة",
          cost_desc: "تجنب رسوم المحاماة الباهظة والدعاوى القانونية الطويلة."
        },
        glance: {
          title: "PMA لمحة عامة",
          founded: "تأسس 2013–14",
          founded_label: "أول جمعية للوساطة في باكستان",
          mediations: "2000+",
          mediations_label: "حالات الوساطة والتسهيل الناجحة",
          mediators: "100+",
          mediators_label: "وسطاء معتمدون في جميع أنحاء باكستان",
          training: "100+",
          training_label: "برامج تدريبية مقدمة",
          impact: "تأثير وطني",
          impact_label: "تعزيز الوعي بالوسائل البديلة وإصلاح السياسات"
        },
        about: {
          years: "سنوات",
          stat_label: "تعزيز التميز في الوساطة",
          tab1_title: "عن PMA",
          tab1_text: "PMA (جمعية الوسطاء الباكستانية) هي مؤسسة مستقلة تم تأسيسها لتعزيز حل النزاعات السلمية من خلال الوساطة والحل البديل للنزاعات (ADR) في جميع أنحاء باكستان.",
          tab2_title: "رؤيتنا",
          tab2_text: "في باكستان بناء الوساطة كأهم وأكثر الطرق الموثوقة لحل النزاعات، مع تعزيز ثقافة الحوار البناء والتفاهم المتبادل والتعايش السلمي.",
          tab3_title: "مهمتنا",
          tab3_mission1: "تعزيز الوساطة كآلية يسهل الوصول إليها وفعالة لحل النزاعات",
          tab3_mission2: "تدريب واعتماد الوسطاء وفقاً للمعايير الدولية",
          tab3_mission3: "التعاون مع المحاكم والمؤسسات الحكومية والقطاع الخاص",
          tab3_mission4: "رفع الوعي بفوائد الوساطة في جميع أنحاء المجتمع",
          tab4_title: "تأثيرنا",
          tab4_text1: "نجحت PMA في تدريب مئات المحامين والقضاة والمتخصصين وقامت بدور رئيسي في تعزيز مبادرات الوساطة المرتبطة بالمحاكم في باكستان.",
          tab4_text2: "نحن نستمر في العمل عن كثب مع السلطة القضائية والمصالح الفاعلة لتعزيز الوساطة كنظام حل نزاعات مستدام.",
          info_phone_label: "هل تحتاج إلى خدماتنا؟",
          info_phone_val: "اتصل: +92 300 000 0000",
          info_hours_label: "ساعات العمل",
          info_hours_val: "الاثنين - الجمعة (9 صباحاً إلى 5 مساءً)",
          info_email_label: "راسلنا بالبريد الإلكتروني",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "ما هي الوساطة؟",
          text1: "الوساطة هي عملية طوعية وسرية ومنظمة حيث يساعد وسيط محايد الأطراف في النزاع على التواصل وفهم وجهات نظر بعضهم البعض والوصول إلى حل مقبول للطرفين.",
          text2: "إنها تمكن الأطراف من تشكيل النتيجة، وتحافظ على العلاقات، وتوفر الوقت والتكلفة والتوتر العاطفي.",
          btn: "فهم عملية الوساطة"
        },
        why_choose: {
          title: "لماذا تختار <span class='pma-about-heading-accent'>PMA؟</span>",
          lead: "نحن نجمع بين المعايير الدولية والفهم المحلي لتقديم حلول بديلة لتسوية النزاعات (ADR) أخلاقية، وفعالة، ومستدامة.",
          btn: "تعرف على المزيد حول PMA",
          features: {
            f1_title: "المعايير الدولية",
            f1_desc: "نحن نتبع مبادئ وممارسات الوساطة المعترف بها عالمياً.",
            f2_title: "وسطاء ذوو خبرة ومعتمدون",
            f2_desc: "تضم لوحتنا محترفين مدربين تدريباً عالياً ومعتمدين.",
            f3_title: "عملية سرية للغاية",
            f3_desc: "خصوصيتك هي أولويتنا القصوى في كل مرحلة من مراحل العملية.",
            f4_title: "نتائج أسرع وودية",
            f4_desc: "نساعد في حل النزاعات بكفاءة وفعالية عالية.",
            f5_title: "فعالية من حيث التكلفة",
            f5_desc: "بديل عملي وممتاز للتقاضي المكلف والطويل."
          }
        },
        training: {
          title_part1: "التدريب المهني و",
          title_part2: "الاعتماد (Accreditation)",
          text: "توفر PMA برامج تدريب وتطوير مهني متوافقة مع المعايير الدولية في مجال الوساطة، ومصممة خصيصاً للمحامين، ومحترفي الشركات، وفرق الموارد البشرية، والمعلمين، والوسطاء الطموحين. تركز ورش العمل وبرامج الشهادات لدينا على مهارات حل النزاعات العملية، واستراتيجيات التفاوض، والتواصل، وأطر الحلول البديلة لتسوية النزاعات (ADR).",
          features: {
            feat1: "اعتماد IMI",
            feat2: "مدربون خبراء",
            feat3: "تعلم عملي",
            feat4: "معايير عالمية"
          },
          card_text: "تلبي برامجنا التدريبية المعايير الدولية وتمكن المحترفين من أن يصبحوا وسطاء فعالين وأخلاقيين ومؤهلين عالمياً.",
          btn_text: "استكشاف برامج التدريب"
        },
        services: {
          title: "خدماتنا الأساسية",
          list: {
            s1: { title: "الوساطة التجارية والشركات", desc: "حل النزاعات التجارية والتعاقدية بكفاءة." },
            s2: { title: "الوساطة المرتبطة بالمحاكم", desc: "دعم تسوية المنازعات للقضايا المرتبطة بالمحاكم." },
            s3: { title: "الوساطة الأسرية والمجتمعية", desc: "مساعدة العائلات على حل النزاعات سلمياً." },
            s4: { title: "نزاعات العمل والتنظيم", desc: "معالجة الصراعات الداخلية في مكان العمل." },
            s5: { title: "تدريب الوسطاء المعتمد من IMI", desc: "برامج تطوير المهارات والاعتماد." },
            s6: { title: "ورش العمل وبرامج التوعية", desc: "جلسات تعليمية لتعزيز ثقافة حل النزاعات." },
            s7: { title: "الاستشارات المؤسسية والسياسات", desc: "دعم المؤسسات في بناء أنظمة تسوية المنازعات." }
          }
        },
        leadership: {
          title: "تعرف على قيادتنا",
          roles: { president: "الرئيس", secretary: "الأمين العام", vp_north: "نائب الرئيس - الشمال", ec_north: "اللجنة التنفيذية - الشمال" }
        },
        stats: {
          s1: { label: "وساطات ميسرة", unit: "+" },
          s2: { label: "حلول ناجحة", unit: "%" },
          s3: { label: "عملية خاصة 100%", value: "سري" },
          s4: { label: "وسطاء مدربون", value: "معتمد" }
        },
        partners: {
          title: "شركاؤنا",
          p1: "محكمة السند العليا",
          p2: "المؤسسات الحكومية",
          p3: "المعهد الدولي للوساطة"
        },
        cta: {
          title: "لنتحدث لأننا نستطيع.",
          subtitle: "هل أنت مستعد لحل نزاعك سلمياً؟ أو مهتم بأن تصبح وسيطاً معتمداً؟ اتصل بنا اليوم",
          btn1: "طلب استشارة مجانية",
          btn2: "كن وسيطاً معتمداً",
          link: "تحدث فوراً مع فريقنا"
        },
        footer: {
          brand: {
            tagline: "تعزيز الحلول السلمية من خلال الحوار والوساطة والتفاهم المتبادل في جميع أنحاء باكستان.",
            logo_alt: "الجمعية الباكستانية للوسطاء"
          },
          quick_links: {
            title: "روابط سريعة",
            items: [
              { label: "الرئيسية", link: "index.html" },
              { label: "عن PMA", link: "about.html" },
              { label: "الوساطة", link: "mediation.html" },
              { label: "الخدمات", link: "services.html" },
              { label: "التدريب", link: "training.html" },
              { label: "القيادة", link: "leadership.html" },
              { label: "الموارد", link: "resources.html" },
              { label: "الفعاليات", link: "events.html" },
              { label: "اتصل بنا", link: "contact.html" }
            ]
          },
          services: {
            title: "خدماتنا",
            items: [
              "خدمات الوساطة",
              "تدريب الوسطاء المعتمد من IMI",
              "ورش عمل وجلسات توعية حول ADR",
              "استشارات مؤسسية في ADR",
              "السياسات ودعم الوساطة"
            ]
          },
          contact: {
            title: "معلومات الاتصال",
            hours: "من الاثنين إلى الجمعة (9 صباحاً - 5 مساءً)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 الجمعية الباكستانية للوسطاء (PMA). جميع الحقوق محفوظة.",
            legal: [
              { label: "الأسئلة الشائعة (FAQ's)", link: "faq.html" },
              { label: "سياسة الخصوصية", link: "privacy-policy.html" },
              { label: "سياسة الشكاوى والاستئناف", link: "complaint-policy.html" },
              { label: "الشروط والأحكام", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "عن الجمعية الباكستانية للوسطاء",
            eyebrow: "عن PMA",
            title_part1: "بناء ثقافة قائمة على",
            title_part2: "الحوار، والحلول السلمية، والتفاهم المتبادل",
            lead: "تلتزم الجمعية الباكستانية للوسطاء (PMA) بتطوير الوساطة والحلول البديلة لتسوية النزاعات (ADR) في جميع أنحاء باكستان من خلال التدريب المهني، والتعاون المؤسسي، ومعايير الممارسة المعترف بها دولياً."
          },
          about: {
            hero_img_alt: "عن الجمعية الباكستانية للوسطاء",
            hero_eyebrow: "عن PMA",
            hero_title_part1: "بناء ثقافة قائمة على",
            hero_title_part2: "الحوار، والحلول السلمية، والتفاهم المتبادل",
            hero_lead: "تلتزم الجمعية الباكستانية للوسطاء (PMA) بتطوير الوساطة والحلول البديلة لتسوية النزاعات (ADR) في جميع أنحاء باكستان من خلال التدريب المهني، والتعاون المؤسسي، ومعايير الممارسة المعترف بها دولياً.",
            badge_years: "سنوات",
            badge_stat_label: "تعزيز التميز في <br>مجال الوساطة",
            nav_tab1: "عن الجمعية",
            nav_tab2: "رؤيتنا",
            nav_tab3: "رسالتنا",
            nav_tab4: "تأثيرنا",
            tab1_title1: "عن",
            tab1_title2: "PMA",
            tab1_text: "تأسست جمعية PMA في عام 2013 وهي مسجلة لدى حكومة باكستان، وهي الهيئة المهنية المعتمدة من قبل مركز التسوية الفعالة للنزاعات (CEDR) في المملكة المتحدة، لتقديم التدريب على الوساطة وفقًا لنموذج CEDR في باكستان.<br><br>وقعت PMA مذكرة تفاهم مع مركز تايلاند للتحكيم (2018) وتحافظ على علاقات قوية مع المؤسسات في دول سارك (SAARC) الأخرى.<br><br>تضم جمعيتنا مدربين معتمدين دولياً ووسطاء مدربين في CEDR نجحوا في تقديم العديد من البرامج التدريبية للقضاة والمحامين في جميع أنحاء السند والبنجاب وإسلام آباد، مما ساهم في رفع المعايير المهنية للوساطة في البلاد.",
            tab2_title1: "رؤيتنا",
            tab2_title2: "",
            tab2_text: "ترسيخ الوساطة كوسيلة رائدة والأكثر موثوقية لتسوية النزاعات في باكستان، وتعزيز ثقافة الحوار البنّاء، والتفاهم المتبادل، والتعايش السلمي.",
            tab3_title1: "رسالتنا",
            tab3_title2: "",
            tab3_points: [
              "تعزيز الوساطة كآلية ميسرة وفعالة لتسوية النزاعات",
              "تدريب واعتماد الوسطاء بما يتماشى مع المعايير الدولية",
              "التعاون مع المحاكم والمؤسسات الحكومية والقطاعات الخاصة",
              "رفع مستوى الوعي بفوائد الوساطة في جميع أنحاء المجتمع"
            ],
            tab4_title1: "تأثيرنا",
            tab4_title2: "",
            tab4_text1: "نجحت جمعية PMA في تدريب مئات المحامين والقضاة والمهنيين، ولعبت دوراً رئيسياً في تعزيز مبادرات الوساطة المرتبطة بالمحاكم في باكستان.",
            tab4_text2: "نحن نواصل العمل عن كثب مع القضاء وأصحاب المصلحة لتعزيز الوساطة كنظام مستدام لتسوية النزاعات."
          },
          leadership: {
            title1: "القيادة",
            title2: "الرسائل",
            president: {
              name: "آغا ظفر أحمد",
              role1: "محامٍ لدى المحكمة العليا في باكستان",
              role2: "الرئيس",
              role3: "الجمعية الباكستانية للوسطاء",
              heading: "رسالة الرئيس",
              quote: "الوساطة ليست مجرد أداة مهنية، بل هي ضرورة ملحة لنظام قانوني متطور.",
              lead: "مع تطور المشهد القانوني والتجاري، لم يكن دور الحلول البديلة لتسوية النزاعات (ADR) أكثر أهمية من أي وقت مضى لضمان تحقيق عدالة سريعة ومنصفة وفعالة. ينصب تركيزي كرئيس على توسيع نطاق انتشارنا، لضمان أن تصبح الوساطة حجر الزاوية في مشهدنا القانوني.",
              read_more: "قراءة الرسالة كاملة",
              sign_role: "محامٍ لدى المحكمة العليا في باكستان<br>رئيس الجمعية الباكستانية للوسطاء",
              popup: {
                p1: "إنه لشرف كبير لي أن أخدم كرئيس للجمعية الباكستانية للوسطاء (PMA). مع تطور المشهد القانوني والتجاري، لم يكن دور الحلول البديلة لتسوية النزاعات (ADR) أكثر أهمية من أي وقت مضى لضمان تحقيق عدالة سريعة ومنصفة وفعالة.",
                p2: "إن مسيرتي كعضو مؤسس في هذه الجمعية كانت مدفوعة بإيماني بأن الوساطة ليست مجرد أداة مهنية، بل هي ضرورة لنظام قانوني متطور. وبينما نتطلع نحو المستقبل، فإن التزامي هو ضمان أن تصبح جمعيتنا منصة أكثر حيوية وتعاوناً، لسد الفجوة بين التقاضي التقليدي والحلول الحديثة لتسوية النزاعات.",
                p3: "منذ تأسيسنا، كرست PMA جهودها لتعزيز وتنظيم ممارسة الوساطة في جميع أنحاء باكستان. نحن نسعى جاهدين للحفاظ على أعلى معايير السلوك المهني وتقديم صوت موحد للوسطاء على مستوى الوطن. ينصب تركيزي كرئيس على توسيع نطاق انتشارنا، لضمان أن تصبح الوساطة حجر الزاوية في مشهدنا القانوني، ومعترفاً بها من قبل كل من القضاء والجمهور كأداة حيوية للوئام الاجتماعي والاقتصادي.",
                commit_heading: "نحن ملتزمون بـ:",
                commit_list: [
                  "<strong>بناء القدرات والتطوير المهني:</strong> الاستمرار في تسهيل التدريب والاعتماد رفيع المستوى للوسطاء لضمان ممارسات ذات معايير عالمية للحفاظ على مهارات أعضائنا في طليعة هذه المهنة.",
                  "<strong>الدعم والمناصرة:</strong> التواصل مع أصحاب المصلحة والقضاء لدمج الوساطة في الإطار القانوني السائد.",
                  "<strong>الابتكار:</strong> تبني التقنيات الحديثة وأفضل الممارسات العالمية لحل النزاعات التجارية والبحرية والشركات بفعالية.",
                  "<strong>المؤتمرات الوطنية:</strong> سنسعى لتنظيم لقاءات منتظمة لتبادل الأفكار والاحتفاء بالنجاحات وتعزيز صوتنا الجماعي في جميع أنحاء البلاد.",
                  "<strong>التنسيق المحسن:</strong> نحن ملتزمون بتحسين التواصل والمشاركة بين جميع الأعضاء لضمان سماع وتقدير كل وجهة نظر.",
                  "<strong>نمو العضوية:</strong> نرحب بنشاط بالمهنيين الجدد لتوسيع نطاق الوساطة وتأثيرها داخل المجتمعات القانونية والتجارية في باكستان.",
                  "<strong>ميثاق الشرف للوسطاء:</strong> علاوة على ذلك، فإن الأولوية الرئيسية لهذه الدورة هي إنشاء لجنة جديدة مخصصة للتنسيق مع مجلس بار الباكستاني ومجالس بار الأقاليم. سيركز هذا القرار على إضفاء الطابع الرسمي على ميثاق شرف قوي وصارم للوسطاء، مما يضمن بقاء ممارستنا قائمة على أعلى المعايير الأخلاقية والمهنية."
                ],
                closing: "إنني أدعوكم جميعاً للانضمام إلينا في هذه المهمة لتعميم الوساطة وتعزيز ثقافة الانسجام والتميز المهني في باكستان."
              }
            },
            founding_president: {
              name: "أنور كاشف ممتاز",
              role1: "محامٍ لدى المحكمة العليا في باكستان",
              role2: "وسيط معتمد",
              heading: "رسالة الرئيس المؤسس",
              quote: "معاً، يمكننا بناء ثقافة يسود فيها التفاهم على المواجهة.",
              lead: "إن رسالتنا هي تعزيز الوساطة كأداة فعالة نحو وسائل أخلاقية ومتاحة لتسوية النزاعات داخل وطننا الحبيب.",
              read_more: "قراءة الرسالة كاملة",
              sign_role: "محامٍ لدى المحكمة العليا<br>وسيط معتمد",
              popup: {
                p1: "اليوم، وبصفتي الرئيساً المؤسساً للجمعية الباكستانية للوسطاء، يسعدني جداً أن أشهد نمو هذه المنصة المخصصة للحوار والحل السلمي للنزاعات. إن رسالتنا هي تعزيز الوساطة كأداة فعالة نحو وسائل أخلاقية ومتاحة لتسوية النزاعات داخل وطننا الحبيب. ونحن لا نزال ملتزمين بإنفاذ أعلى المعايير المهنية وتعزيز الثقة في آليات الحلول البديلة لتسوية النزاعات.",
                p2: "من خلال التعاون والتدريب والتعلم المستمر، نهدف إلى تعزيز قدرات الوسطاء في جميع أنحاء البلاد.",
                p3: "أحث جميع أصحاب المصلحة على تبني الوساطة كمسار بناء لدعم القضاء والمضي قدماً نحو العدالة والوئام.",
                closing: "معاً، يمكننا بناء ثقافة يسود فيها التفاهم على المواجهة."
              }
            },
            stats: {
              s1_title: "تدريب المئات",
              s1_text: "تدريب المحامين والقضاة والمهنيين في جميع أنحاء باكستان.",
              s2_title: "الوساطة المرتبطة بالمحاكم",
              s2_text: "تعزيز وتقوية مبادرات الوساطة على مستوى البلاد.",
              s3_title: "تعاون قوي",
              s3_text: "العمل عن كثب مع القضاء وأصحاب المصلحة من أجل نظام مستدام لتسوية النزاعات."
            }
          },
          partners: {
            title: "شركاؤنا",
            p1: "محكمة السند العليا",
            p2: "المؤسسات الحكومية",
            p3: "المعهد الدولي للوساطة"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "غرفة الاستشارات الخاصة بالوساطة",
            eyebrow: "الوساطة (Mediation)",
            title_part1: "حل النزاعات من خلال",
            title_part2: "الحوار وبناء التفاهم",
            lead: "الوساطة هي عملية تطوعية، سرية، ومنظمة يساعد من خلالها وسيط محايد الأطراف على التوصل إلى حل مستدام ومقبول للجميع."
          },
          mediation: {
            title1: "ما هي",
            title2: "الوساطة؟",
            text1: "الوساطة هي عملية تطوعية وسرية ومنظمة يقوم فيها طرف ثالث محايد ونزيه — وهو الوسيط (Mediator) — بتسهيل الحوار بين الأطراف المتنازعة لمساعدتهم على التوصل إلى حل مقبول ومستدام للجميع.",
            text2: "على عكس التقاضي في المحاكم، تركز الوساطة على التعاون، والتقرير الذاتي، والحل المبتكر للمشكلات. وهي تمكّن الأطراف من تحقيق نتائج أسرع وأكثر فعالية من حيث التكلفة مع الحفاظ على العلاقات الودية.",
            img_alt: "ما هي الوساطة"
          }, whyChoose: {
            heading_part1: "لماذا تختار",
            heading_part2: "الوساطة",
            heading_part3: "مع PMA؟",
            cards: {
              card1: {
                title: "أسرع وأقل تكلفة",
                desc: "حل النزاعات في غضون أسابيع وليس سنوات."
              },
              card2: {
                title: "سرية تامة",
                desc: "عملية خاصة وآمنة دون أي سجلات عامة."
              },
              card3: {
                title: "الحفاظ على العلاقات",
                desc: "التركيز على التفاهم المتبادل والحلول المرضية للطرفين (win-win)."
              },
              card4: {
                title: "مرنة وتشاركيه",
                desc: "الأطراف المتنازعة تتحكم بشكل كامل في النتائج والقرارات."
              },
              card5: {
                title: "معايير معتمدة من IMI",
                desc: "اعتماد للوسطاء معترف به على المستوى الدولي."
              }
            }
          },
          banner: {
            text: "إن PMA هي المنظمة المتخصصة <strong>الأولى والأقدم</strong> في باكستان لاعتماد الوساطة، والتدريب المهني، والمناصرة — <strong>تأسست في 2013–2014</strong> ومقرها الرئيسي في كراتشي."
          },
          how_it_works: {
            title_part1: "كيف تعمل",
            title_part2: "الوساطة؟",
            img_alt: "عملية الوساطة",
            steps: {
              step1: {
                num: "١",
                title: "تقديم طلبك",
                desc: "تقوم بالاتصال بـ PMA لمشاركة تفاصيل النزاع الخاص بك."
              },
              step2: {
                num: "٢",
                title: "التقييم الأولي للحالة",
                desc: "نقوم بمراجعة المسألة وتحديد مدى ملاءمتها للوساطة."
              },
              step3: {
                num: "٣",
                title: "تعيين الوسيط",
                desc: "يتم تعيين وسيط محايد ومؤهل لمتابعة قضيتك."
              },
              step4: {
                num: "٤",
                title: "الجلسات الميسرة",
                desc: "يقوم الوسيط بتسهيل حوار منظم لاستكشاف الحلول الممكنة."
              },
              step5: {
                num: "٥",
                title: "التسوية والاتفاق",
                desc: "يتوصل الأطراف إلى نتيجة مقبولة للجميع ويتم صياغة الاتفاقية بشكل رسمي."
              }
            }
          },
          who_we_serve: {
            title_part1: "من هم",
            title_part2: "عملاؤنا؟",
            cards: {
              card1: {
                title: "الأفراد والعائلات",
                desc: "مساعدة الأفراد والعائلات على تسوية النزاعات الشخصية والمدنية."
              },
              card2: {
                title: "الشركات والمؤسسات",
                desc: "دعم الشركات في حل النزاعات التجارية والنزاعات في بيئة العمل."
              },
              card3: {
                title: "المؤسسات الحكومية",
                desc: "مساعدة الدوائر الحكومية في حل النزاعات المتعلقة بالقطاع العام."
              },
              card4: {
                title: "المنظمات غير الحكومية والمجتمعية",
                desc: "تسهيل حل النزاعات للمنظمات الاجتماعية والمجتمعية."
              },
              card5: {
                title: "شركات المحاماة والمحترفون القانونيون",
                desc: "الشراكة مع المتخصصين في القانون لتقديم حلول بديلة فعالة لتسوية النزاعات (ADR)."
              }
            }
          },
          cta: {
            title_part1: "دعونا نحل النزاعات",
            title_part2: "بطرق سلمية.",
            subtitle: "الوساطة تبني التفاهم، والتفاهم يصنع الحلول. اتصل بـ PMA اليوم لمعرفة كيف يمكن للوساطة أن تساعدك.",
            btn_text: "اتصل بنا اليوم"
          }
        },
        "services-page": {
          hero: {
            img_alt: "الصورة الرئيسية للخدمات",
            eyebrow: "خدماتنا",
            title_part1: "الوساطة المهنية و",
            title_part2: "خدمات الحلول البديلة لتسوية النزاعات (ADR)",
            lead: "تقدم PMA مجموعة شاملة من خدمات الوساطة، والتدريب، والاستشارات لمساعدة الأفراد، والمنظمات، والمؤسسات على حل النزاعات بفعالية وبناء ثقافة الحوار."
          },
          work_with: {
            title_part1: "من هم",
            title_part2: "شركاؤنا في",
            title_part3: "العمل؟",
            items: {
              item1: "شركات المحاماة والمهنيون القانونيون",
              item2: "الشركات والمؤسسات التجارية",
              item3: "المؤسسات الحكومية",
              item4: "المنظمات غير الحكومية والمجتمعية",
              item5: "المؤسسات التعليمية",
              item6: "السلطة القضائية والقطاع العام"
            }
          },
          services_cta: {
            title_part1: "دعونا نبني معاً أنظمة",
            title_part2: "أفضل لحل النزاعات.",
            subtitle: "شاهد شراكة مثمرة مع PMA للحصول على خدمات الوساطة، والتدريب المهني، والحلول الاستشارية المصممة خصيصاً لتلبية احتياجاتك.",
            btn_text: "اتصل بنا"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "الصورة الرئيسية لصفحة الاتصال",
            eyebrow: "اتصل بنا",
            title_part1: "نحن هنا من أجل",
            title_part2: "مساعدتك.",
            lead: "سواء كان لديك سؤال، أو بحاجة إلى توجيه، أو ترغب في التعاون معنا، فإن فريقنا مستعد لمساعدتك. تواصل معنا وسنقوم بالرد عليك في أقرب وقت ممكن.",
            features: {
              f1_title: "سرية تامة",
              f1_desc: "معلوماتك محمية وآمنة دائماً",
              f2_title: "سرعة الاستجابة",
              f2_desc: "عادتةً ما نقوم بالرد خلال 24 ساعة",
              f3_title: "احترافية عالية",
              f3_desc: "فريق ذو خبرة من خبراء الوساطة"
            }
          },
          "contact_section": {
            "info_col": {
              "title": "اتصل بنا",
              "lead": "نحن هنا للإجابة على أسئلتك وتقديم الدعم الذي تحتاجه في رحلتك نحو الوساطة.",
              "labels": {
                "address": "عنوان المكتب",
                "email": "البريد الإلكتروني",
                "phone": "الهاتف",
                "whatsapp": "واتساب",
                "hours": "ساعات العمل"
              },
              "values": {
                "address_text": "253، بي.إي.سي.إتش.إس، المربع 6، متفرع من شارع فيصل، كراتشي 75400، باكستان",
                "hours_text": "الاثنين – الجمعة 9:00 صباحاً – 5:00 مساءً (بتوقيت باكستان)"
              }
            },
            "form_col": {
              "title": "أرسل لنا رسالة",
              "lead": "شاركنا ببعض التفاصيل وسيقوم فريقنا بالرد عليك.",
              "labels": {
                "name": "الاسم الكامل",
                "email": "البريد الإلكتروني",
                "phone": "رقم الهاتف",
                "inquiry": "نوع الاستفسار",
                "subject": "الموضوع",
                "message": "الرسالة",
                "consent": "جميع المحادثات سرية للغاية ومعلوماتك آمنة ومحمية."
              },
              "placeholders": {
                "name": "اسمك",
                "email": "بريدك الإلكتروني",
                "phone": "هاتفك",
                "subject": "موضوع رسالتك",
                "message": "كيف يمكننا مساعدتك؟"
              },
              "options": {
                "default": "حدد خياراً",
                "general": "استفسار عام",
                "mediation": "خدمات الوساطة",
                "training": "التدريب والشهادات",
                "membership": "معلومات العضوية",
                "advisory": "الاستشارات المؤسسية لحل النزاعات بدائل (ADR)",
                "workshops": "ورش العمل وجلسات التوعية",
                "event": "المشاركة في الفعاليات",
                "partnership": "الشراكة والتعاون",
                "media": "الاستفسارات الإعلامية والصحفية",
                "consultation": "الاستشارات القانونية / السياسات العامة",
                "feedback": "شكوى أو مقترح",
                "volunteer": "الفرص التطوعية",
                "speaker": "طلب متحدث / مدرب",
                "corporate": "دعم الوساطة للشركات",
                "community": "دعم الوساطة المجتمعية",
                "support": "الدعم الفني للموقع الإلكتروني"
              },
              "btn_text": "إرسال الرسالة",
              "success_msg": "تم إرسال رسالتك بنجاح. سنقوم بالرد عليك خلال 24 ساعة.",
              "error_msg": "عذراً، حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى.",
              "note": "لا توجد إجراءات قانونية. لا محاكم. فقط حلول ودية وتصفية. نرد عادةً خلال 24 ساعة."
            }
          },
          "map_section": {
            "title": "تفضل بزيارة مكتبنا",
            "lead": "نرحب بزيارتكم لنا في مكتبنا الكائن في كراتشي.",
            "iframe_title": "موقع مكتب PMA — ٢٥٣، بي.إي.سي.إتش.إس، المربع ٦، كراتشي"
          }

        },
        "faq_page": {
          "hero": {
            "img_alt": "الصورة الرئيسية لصفحة الأسئلة الشائعة",
            "title": "الأسئلة الشائعة",
            "lead": "اعثر على إجابات لأكثر الأسئلة شيوعاً حول الوساطة وخدماتنا."
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "ما هو البند القياسي للوساطة؟",
                "answer": "إن أي نزاع或是 خلاف أو مسألة قد تنشأ بين أطراف هذه الاتفاقية يتعين تسويتها أولاً من قبل الأطراف من خلال محاولة حل النزاع ودياً عبر المفاوضات المتبادلة. وفي حال تعذر تسوية النزاعات أو الخلافات أو المسائل ودياً أو بشكل مرضٍ عن طريق المراسلات أو المناقشة المتبادلة في غضون ثلاثين يوماً (30) من استلام أحد الأطراف طلب الطرف الآخر للتسوية الودية، يتم إحالتها إلى الوساطة أمام لجنة من وسيطي PMA المعتمدين. وتخضع إجراءات الوساطة لقواعد الوساطة المعترف بها دولياً."
              },
              "q2": {
                "question": "الوساطة كبديل للتكلفة والوقت",
                "answer": "توفر الوساطة بديلاً أسرع وأكثر فعالية من حيث التكلفة ويتسم بالسرية مقارنة بالإجراءات القانونية المطولة. وهي تساعد الأطراف على حل النزاعات ودياً مع الحفاظ على العلاقات المهنية والشخصية."
              },
              "q3": {
                "question": "ما هي الوساطة؟",
                "answer": "الوساطة هي عملية تطوعية وسرية يقوم فيها طرف ثالث محايد بمساعدة الأطراف المتنازعة على التوصل إلى اتفاق مقبول متبادل بينهما."
              },
              "q4": {
                "question": "كيف يمكن تجربة الوساطة展开？",
                "answer": "يمكنك الاتصال بـ PMA من خلال موقعنا الإلكتروني أو مكتبنا لبدء خدمات الوساطة. سيقوم فريقنا بتوجيهك خلال العملية وتوصيلك بوسطاء معتمدين."
              },
              "q5": {
                "question": "فوائد الوساطة",
                "benefits_list": {
                  "b1": "تسويه أسرع للنزاعات",
                  "b2": "تكاليف قانونية أقل",
                  "b3": "إجراءات سرية للغاية",
                  "b4": "حلول مرنة ومبتكرة",
                  "b5": "تحسين مستويات التواصل بين الأطراف"
                }
              },
              "q6": {
                "question": "متى ستُعقد جلسة الوساطة؟",
                "answer": "يتم جدولة جلسة الوساطة بناءً على توفر كلا الطرفين والوسيط. وتقوم PMA بتنسيق العملية لضمان الراحة والكفاءة."
              },
              "q7": {
                "question": "ماذا يحدث في جلسة الوساطة؟",
                "answer": "خلال الوساطة، يناقش كلا الطرفين مخاوفهما في بيئة مهيكلة ييسرها وسيط يساعد في استكشاف الحلول والأرضية المشتركة."
              },
              "q8": {
                "question": "ماذا يحدث إذا لم يتم التوصل إلى اتفاق؟",
                "answer": "إذا لم تؤدِ الوساطة إلى اتفاق، يظل كلا الطرفين حراً في متابعة الخيارات القانونية أو خيارات تسوية النزاعات الأخرى المتاحة لهما."
              },
              "q9": {
                "question": "من يمكنه حضور جلسة الوساطة؟",
                "answer": "لا يجوز حضور جلسة الوساطة إلا للأطراف المعنية، وممثليها المفوضين، والمستشارين القانونيين (إذا سُمح بذلك)، والوسيط."
              },
              "q10": {
                "question": "كم ستكون التكلفة؟",
                "answer": "تعتمد تكلفة الوساطة على طبيعة النزاع وتعقيده ومدته. وتقدم PMA تفاصيل الرسوم قبل بدء عملية الوساطة."
              }
            },
            "contact_box": {
              "title": "هل لا تزال لديك أسئلة؟",
              "lead": "نحن هنا للمساعدة. تواصل معنا وسيسعد فريقنا بتقديم الدعم لك.",
              "btn_text": "اتصل بنا"
            }
          }
        },
        "training-page": {
          "hero": {
            "hero_img_alt": "الصورة الرئيسية لصفحة التدريب",
            "eyebrow": "التدريب المهني",
            "title_part1": "بناء وسطاء المستقبل في باكستان من خلال",
            "title_part2": "تدريب معترف به دولياً",
            "lead": "عزز مهاراتك. ارتقِ بممارستك المهنية. عزز لغة الحوار والتفاهم والحلول السلمية في المجتمع.",
            "banner": {
              "logo_alt": "المعهد الدولي للوساطة",
              "title": "برنامج تدريب الوسطاء المعتمد من IMI",
              "tagline": "معترف به دولياً. ومحترم عالمياً.",
              "desc": "تعد PMA مزود تدريب مسجل رسمياً لدى المعهد الدولي للوساطة (IMI). ويلبي برنامجنا لتدريب الوسطاء المعتمد من IMI أعلى المعايير العالمية للتدريب المهني للوسطاء.",
              "link_text": "لمزيد من المعلومات يرجى الضغط على الرابط"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "برامجنا",
              "title_part2": "التدريبية",
              "title_part3": ""
            },
            "programs": {
              "accredited_course": {
                "badge": "دورة معتمدة",
                "title": "الدورة المعتمدة لمهارات الوساطة",
                "desc_p1": "هذه الدورة مخصصة للمهتمين بالتعرف على مهارات الوساطة، حيث سيصبح المرشح مستهلكاً واعياً ومثقفاً لهذه العملية.",
                "desc_p2": "يتم تقديم جميع الدورات من خلال التمارين العملية ولعب الأدوار.",
                "metrics": {
                  "total_hours": "إجمالي الساعات",
                  "days": "الأيام (الثلاثاء - السبت)",
                  "daily_hours": "الساعات اليومية",
                  "cert_status": "الشهادة",
                  "cert_sub": "معتمدة"
                },
                "outcomes": {
                  "headline": "في نهاية الدورة، يجب أن يكون المشارك قادراً على:",
                  "list": {
                    "item1": "اكتساب المهارة في الوساطة",
                    "item2": "تعلم أفضل الممارسات في الوساطة",
                    "item3": "التعرف على القوانين الباكستانية المتعلقة بالوساطة",
                    "item4": "تعلم مهارات التفاوض",
                    "item5": "أن يصبح وسيطاً معتمداً"
                  }
                },
                "btn_text": "عرض تفاصيل الدورة"
              },
              "introductory_course": {
                "badge": "دورة غير معتمدة",
                "title": "الدورة التمهيدية لمهارات الوساطة",
                "desc_p1": "هذه الدورة مخصصة للمهتمين بالحصول على معرفة عامة وبسيطة عن مهارات الوساطة. وهي دورة ذات مستوى أساسي جداً.",
                "desc_p2": "لا تحتوي هذه الدورة على أي تمارين عمليّة أو لعب للأدوار.",
                "metrics": {
                  "total_hours": "إجمالي الساعات",
                  "days": "الأيام (سيتم الإعلان عنها)",
                  "daily_hours": "الساعات اليومية",
                  "cert_status": "غير معتمدة"
                },
                "btn_text": "عرض تفاصيل الدورة"
              },
              "basic_info_course": {
                "badge": "دورة غير معتمدة",
                "title": "معلومات أساسية حول مهارات الوساطة",
                "desc_p1": "هذه الدورة مخصصة للمهتمين بالحصول على معرفة عامة وبسيطة عن مهارات الوساطة. وهي دورة ذات مستوى أساسي جداً.",
                "desc_p2": "لا تحتوي هذه الدورة على أي تمارين عمليّة أو لعب للأدوار.",
                "metrics": {
                  "total_hours": "إجمالي الساعات",
                  "days": "يوم واحد",
                  "daily_hours": "الساعات اليومية",
                  "cert_status": "غير معتمدة"
                },
                "btn_text": "عرض تفاصيل الدورة"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "من",
              "title_part2": "ينبغي له",
              "title_part3": "الحضور؟",
              "subtitle": "تم تصميم هذا التدريب للمهنيين الراغبين في إحداث فارق حقيقي"
            },
            "cards": {
              "c1": {
                "title": "المحامون والقانونيون",
                "desc": "عزز مهاراتك في تسوية النزاعات ووسع نطاق ممارستك المهنية."
              },
              "c2": {
                "title": "القضاة ومسؤولو المحاكم",
                "desc": "عزز فهمك للوسائل البديلة لتسوية النزاعات (ADR) وادعم إدارة القضايا بفعالية."
              },
              "c3": {
                "title": "مهنيو الشركات وقطاع الأعمال",
                "desc": "طور مهارات التفاوض والتواصل وإدارة النزاعات في بيئة العمل."
              },
              "c4": {
                "title": "مسؤولو الموارد البشرية والإدارة",
                "desc": "ابنِ حلولاً للنزاعات تركز على الأفراد وعزز الانسجام في مكان العمل."
              },
              "c5": {
                "title": "المنظمات غير الحكومية وقادة المجتمع",
                "desc": "حل النزاعات المجتمعية وعزز التماسك الاجتماعي والشمولية."
              },
              "c6": {
                "title": "الطلاب والمهتمون بـ ADR",
                "desc": "ابدأ رحلتك في مجال الوساطة وابنِ أساساً قوياً في الحلول البديلة للنزاعات."
              },
              "c7": {
                "title": "المسؤولون الحكوميون",
                "desc": "طبق مهارات الوساطة في نزاعات القطاع العام وتنفيذ السياسات."
              },
              "c8": {
                "title": "أي شخص مهتم بالوساطة و ADR",
                "desc": "متاح لكل من لديه شغف بالحوار السلمي وحل النزاعات."
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "خلفيات مختلفة، هدف واحد",
            "title": "خلفيات مختلفة. هدف واحد: الحل السلمي.",
            "desc": "يجمع تدريبنا بين مهنيين متنوعين يؤمنون بلغة الحوار والتفاهم وبناء مجتمعات أفضل.",
            "btn_text": "التسجيل في دورة تدريبية"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "انضم إلى برنامجنا",
              "title": "انضم إلى برامجنا للتدريب على الوساطة",
              "tagline": "خذ الخطوة الأولى نحو التميز",
              "desc": "سجل اليوم لتصبح جزءاً من برامج تدريبية معترف بها دولياً ومصممة لبناء مهاراتك، وتمكين ممارستك المهنية، وتعزيز الحلول السلمية في المجتمع.",
              "img_alt": "أحجار التأمل زين",
              "seat_badge": {
                "title": "احجز مقعدك",
                "desc_part1": "مقاعد محدودة",
                "desc_part2": "متاحة في كل دفعة تدريبية."
              }
            },
            "form_panel": {
              "header_title": "تفاصيل التسجيل",
              "labels": {
                "name": "الاسم الكامل",
                "email": "البريد الإلكتروني",
                "phone": "رقم الهاتف",
                "background": "الخلفية المهنية",
                "city": "المدينة",
                "program": "اختر البرنامج التدريبي",
                "additional_info": "معلومات إضافية (اختياري)"
              },
              "placeholders": {
                "name": "أدخل اسمك الكامل",
                "email": "أدخل بريدك الإلكتروني",
                "phone": "أدخل رقم هاتفك",
                "background": "مثال: محامٍ، مسؤول موارد بشرية، طالب",
                "city": "أدخل مدينتك",
                "program_default": "-- يرجى اختيار البرنامج --",
                "additional_info": "أي معلومات إضافية ترغب في مشاركتها"
              },
              "options": {
                "accredited": "الدورة المعتمدة لمهارات الوساطة",
                "introductory": "الدورة التمهيدية لمهارات الوساطة",
                "basic": "معلومات أساسية حول مهارات الوساطة"
              },
              "btn_text": "تقديم طلب الالتحاق",
              "privacy_note": "معلوماتك آمنة تماماً وسيتم استخدامها لأغراض التسجيل فقط.",
              "messages": {
                "success": "تم إرسال التسجيل بنجاح! سنتواصل معك خلال 24 ساعة.",
                "error": "عذراً، حدث خطأ أثناء إرسال طلب التسجيل الخاص بك. يرجى المحاولة مرة أخرى."
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "معتمد من IMI",
                "desc": "برامجنا معتمدة من قبل المعهد الدولي للوساطة (IMI)."
              },
              "b2": {
                "title": "مدربون خبراء",
                "desc": "تعلم على أيدي وسطاء ذوي خبرة ومهنيين متخصصين في هذا المجال."
              },
              "b3": {
                "title": "معايير دولية",
                "desc": "تدريب متوافق تماماً مع معايير الوساطة المقبولة عالمياً."
              },
              "b4": {
                "title": "شهادة مهنية",
                "desc": "احصل على شهادة معترف بها عند إتمام الدورة بنجاح."
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "دورة معتمدة",
              "title_part1": "الدورة المعتمدة",
              "title_part2": "لمهارات الوساطة",
              "desc": "هذه الدورة مخصصة للمهتمين بالتعرف على مهارات الوساطة، حيث سيصبح المرشح مستهلكاً واعياً ومثقفاً لهذه العملية. يتم تقديم جميع الدورات من خلال التمارين العملية ولعب الأدوار.",
              "stats": {
                "type": { "label": "نوع الدورة", "value": "شهادة معتمدة" },
                "total_hours": { "label": "إجمالي الساعات", "value": "40" },
                "duration": { "label": "المدة", "value": "5 أيام (أسبوع واحد)" },
                "daily_hours": { "label": "الساعات اليومية", "value": "8" },
                "days": { "label": "أيام التدريب", "value": "من الثلاثاء إلى السبت" },
                "time": { "label": "وقت التدريب", "value": "9 صباحاً – 5 مساءً" }
              }
            },
            "main_content": {
              "about": {
                "title": "حول هذه الدورة",
                "desc": "يزود هذا البرنامج الشامل المشاركين بمهارات الوساطة العملية، وتقنيات التفاوض، وفهم القوانين الباكستانية المتعلقة بالوساطة. من خلال التعلم التجريبي والتمارين ولعب الأدوار، سيتم إعداد المشاركين للتعامل مع النزاعات الواقعية بفعالية وأخلاقية."
              },
              "outcomes": {
                "title": "ماذا ستتعلم",
                "items": [
                  "اكتساب المهارة في الوساطة",
                  "تعلم أفضل الممارسات في الوساطة",
                  "التعرف على القوانين الباكستانية المتعلقة بالوساطة",
                  "تعلم مهارات التفاوض",
                  "أن تصبح وسيطاً معتمداً",
                  "صياغة اتفاقيات تسوية فعالة"
                ]
              },
              "columns": {
                "outline": {
                  "title": "مخطط الدورة",
                  "items": [
                    "مشهد الوسائل البديلة لتسوية النزاعات (ADR)",
                    "مراحل وجلسات الوساطة",
                    "التواصل اللفظي وغير اللفظي",
                    "أسلوب ونمط التفاوض",
                    "تقنيات طرح الأسئلة",
                    "منطقة الاتفاق المحتمل (ZOPA)",
                    "كسر الجمود وإنهاء الطريق المسدود",
                    "مسودة اتفاقية التسوية",
                    "القضايا المناسبة للوساطة",
                    "التقييم الذاتي",
                    "تقنيات المساومة والمفاوضة"
                  ]
                },
                "structure": {
                  "title": "هيكل الدورة",
                  "modules": [
                    { "badge": "الوحدة 01", "title": "نظرة عامة على ADR" },
                    { "badge": "الوحدة 02", "title": "عملية الوساطة ومراحلها" },
                    { "badge": "الوحدة 03", "title": "التواصل وطرح الأسئلة" },
                    { "badge": "الوحدة 04", "title": "تقنيات التفاوض" },
                    { "badge": "الوحدة 05", "title": "حل الجمود وتجاوز العقبات" },
                    { "badge": "الوحدة 06", "title": "صياغة التسوية والإغلاق" },
                    { "badge": "الوحدة 07", "title": "التقييم الذاتي وأفضل الممارسات" }
                  ]
                },
                "methodology": {
                  "title": "منهجية التدريب",
                  "items": [
                    "التعلم التجريبي والعملي",
                    "التمارين التطبيقية",
                    "لعب الأدوار والمحاكاة",
                    "المناقشات المجموعاتيّة",
                    "دراسة الحالات الواقعية",
                    "الجلسات التفاعلية"
                  ]
                }
              },
              "certification": {
                "title": "مخرجات الشهادة",
                "desc": "سيتلقى المشاركون شهادة إتمام عند المشاركة الناجحة. تؤهل الدورة الأفراد لتطبيق مهارات الوساطة بشكل أخلاقي ومهني وفعال في سياقات متنوعة."
              },
              "attendees": {
                "title": "من ينبغي له الحضور؟",
                "items": [
                  "المحامون والقانونيون",
                  "القضاة ومسؤولو المحاكم",
                  "مهنيو الشركات وقطاع الأعمال",
                  "مسؤولو الموارد البشرية والإدارة",
                  "المنظمات غير الحكومية وقادة المجتمع",
                  "الطلاب والمهتمون بـ ADR"
                ]
              },
              "btn_text": "تقديم طلب الالتحاق بهذا البرنامج"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "دورة غير معتمدة",
              "title_part1": "الدورة التمهيدية",
              "title_part2": "لمهارات الوساطة",
              "desc": "تم تصميم هذه الدورة للمهتمين بالحصول على معرفة عامة وبسيطة عن مهارات الوساطة. وهي دورة ذات مستوى أساسي جداً وغير معتمدة.",
              "stats": {
                "type": { "label": "دورة غير معتمدة", "value": "" },
                "total_hours": { "label": "إجمالي الساعات", "value": "16" },
                "duration": { "label": "المدة", "value": "يوما عمل (2)" },
                "daily_hours": { "label": "الساعات اليومية", "value": "8" },
                "days": { "label": "أيام التدريب", "value": "أي يومين (سيتم الإعلان عنها)" },
                "time": { "label": "وقت التدريب", "value": "9 صباحاً – 5 مساءً" }
              }
            },
            "main_content": {
              "about": {
                "title": "حول هذه الدورة",
                "desc": "توفر هذه الدورة التمهيدية فهماً أساسياً لمهارات الوساطة وعمليتها. سيصبح المشاركون مستهلكين واعين ومثقفين لعملية الوساطة ولديهم القدرة على فهم المستقبل الذي تحمله. هذه الدورة ذات طابع نظري فقط دون أي تمارين عملية أو لعب للأدوار."
              },
              "outcomes": {
                "title": "ماذا ستتعلم",
                "items": [
                  "فهم أساسيات الوساطة",
                  "تعلم المفاهيم الأساسية للوساطة",
                  "فهم الحالات والأوقات التي يمكن فيها استخدام الوساطة",
                  "الوعي الكامل بعملية الوساطة ومراحلها",
                  "أن تصبح مستهلكاً واعياً ومثقفاً للعملية"
                ]
              },
              "columns": {
                "outline": {
                  "title": "مخطط الدورة",
                  "items": [
                    "مشهد الوسائل البديلة لتسوية النزاعات (ADR)",
                    "مراحل وجلسات الوساطة",
                    "التواصل اللفظي وغير اللفظي",
                    "أسلوب ونمط التفاوض",
                    "تقنيات طرح الأسئلة",
                    "منطقة الاتفاق المحتمل (ZOPA)",
                    "كسر الجمود وإنهاء الطريق المسدود",
                    "مسودة اتفاقية التسوية",
                    "القضايا المناسبة للوساطة",
                    "تقنيات المساومة والمفاوضة"
                  ]
                },
                "info_table": {
                  "title": "معلومات الدورة",
                  "trainer": { "label": "المدرب", "value": "سيتم الإعلان عنه لاحقاً (TBA)" },
                  "daily_hours": { "label": "الساعات اليومية", "value": "ثماني ساعات (8)" },
                  "total_hours": { "label": "إجمالي الساعات", "value": "ست عشرة ساعة (16)" },
                  "days": { "label": "أيام التدريب", "value": "أي يومين (سيتم الإعلان عنها)" },
                  "time": { "label": "وقت التدريب", "value": "9 صباحاً – 5 مساءً" },
                  "duration": { "label": "مدة الدورة", "value": "يومي عمل (2)" },
                  "type": { "label": "نوع الدورة", "value": "دورة غير معتمدة" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "من ينبغي له الحضور؟",
                  "items": [
                    "الطلاب والخريجون الجدد",
                    "المهنيون من أي مجال أو تخصص",
                    "مسؤولو الموارد البشرية والإدارة",
                    "المنظمات غير الحكومية والعاملون في المجتمع",
                    "أي شخص مهتم بمجال الوساطة"
                  ]
                },
                "note": {
                  "title": "ملاحظة هامة",
                  "desc": "هذه دورة ذات مستوى أساسي تم تصميمها لتقديم المعرفة والوعي فقط. لا توجد أي تمارين عمليّة أو لعب للأدوار أو تقييم ذاتي في هذه الدورة."
                }
              },
              "btn_text": "التسجيل في هذه الدورة"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "دورة غير معتمدة",
              "title_part1": "معلومات أساسية حول",
              "title_part2": "مهارات الوساطة",
              "desc": "تم تصميم هذه الدورة التمهيدية لتقديم توعية عامة بمهارات الوساطة وتطبيقاتها. وهي دورة ذات مستوى أساسي وغير معتمدة.",
              "stats": {
                "type": { "label": "دورة غير معتمدة", "value": "" },
                "total_hours": { "label": "إجمالي الساعات", "value": "8" },
                "duration": { "label": "المدة", "value": "يوم واحد (1)" },
                "daily_hours": { "label": "الساعات اليومية", "value": "8" },
                "days": { "label": "أيام التدريب", "value": "أي يوم (سيتم الإعلان عنه)" },
                "time": { "label": "وقت التدريب", "value": "9 صباحاً – 5 مساءً" }
              }
            },
            "main_content": {
              "about": {
                "title": "حول هذه الدورة",
                "desc": "تم تصميم دورة المعلومات الأساسية هذه لتوفير وعي عام بمهارات الوساطة، وعملية الوساطة، والمفاهيم الرئيسية لتسوية النزاعات. سيكتسب المشاركون فهماً تأسيسياً لكيفية عمل الوساطة دون الانخراط في لعب الأدوار أو التمارين العملية."
              },
              "outcomes": {
                "title": "ماذا ستتعلم",
                "items": [
                  "فهم أساسيات الوساطة",
                  "تعلم المفاهيم الأساسية للوساطة",
                  "فهم متى يمكن استخدام الوساطة",
                  "الوعي الكامل بعملية الوساطة ومراحلها",
                  "المفاهيم التأسيسية لحل النزاعات"
                ]
              },
              "columns": {
                "outline": {
                  "title": "مخطط الدورة",
                  "items": [
                    "مشهد الوسائل البديلة لتسوية النزاعات (ADR)",
                    "مراحل وجلسات الوساطة",
                    "مقدمة في علم الوساطة",
                    "نظرة عامة على عملية الوساطة",
                    "التواصل والاتصال في الوساطة",
                    "الأسئلة والايضاحات",
                    "فهم الجمود وتجاوز العقبات",
                    "أساسيات ومبادئ الاتفاق"
                  ]
                },
                "info_table": {
                  "title": "معلومات الدورة",
                  "trainer": { "label": "المدرب", "value": "سيتم الإعلان عنه لاحقاً (TBA)" },
                  "daily_hours": { "label": "الساعات اليومية", "value": "ثماني ساعات (8)" },
                  "total_hours": { "label": "إجمالي الساعات", "value": "ثماني ساعات (8)" },
                  "days": { "label": "أيام التدريب", "value": "أي يوم (سيتم الإعلان عنه)" },
                  "time": { "label": "وقت التدريب", "value": "9 صباحاً – 5 مساءً" },
                  "duration": { "label": "مدة الدورة", "value": "يوم واحد (1)" },
                  "type": { "label": "نوع الدورة", "value": "دورة غير معتمدة" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "من ينبغي له الحضور؟",
                  "items": [
                    "الطلاب والخريجون الجدد",
                    "المهنيون من أي مجال أو تخصص",
                    "مسؤولو الموارد البشرية والإدارة",
                    "المنظمات غير الحكومية والعاملون في المجتمع",
                    "أي شخص مهتم بمجال الوساطة"
                  ]
                },
                "note": {
                  "title": "ملاحظة هامة",
                  "desc": "هذه دورة ذات مستوى أساسي تم تصميمها لتقديم معلومات عامة وتوعية فقط. لا توجد أي تمارين عمليّة أو لعب للأدوار أو تقييم ذاتي في هذه الدورة."
                }
              },
              "btn_text": "التسجيل في هذه الدورة"
            }
          }
        },
        "leadership_page": {
          "hero": {
            "eyebrow": "القيادة",
            "title_main": "القيادة",
            "title_accent": "كوادرنا.. مصدر قوتنا",
            "lead_text": "تعرف على المتخصصين المخلصين الذين يقودون رسالة PMA لتعزيز لغة الحوار والتفاهم والحلول السلمية في جميع أنحاء باكستان."
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "الفريق التنفيذي",
              "sub_committee": "اللجنة الفرعية",
              "mediator": "الوسطاء",
              "trainer": "المدربون",
              "former_president": "الرؤساء السابقون"
            },
            "search_placeholder": "ابحث بالاسم أو التخصص..."
          },
          "members": {
            "member_1": {
              "name": "آغا ظفر أحمد",
              "title": "الرئيس",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ آغا ظفر أحمد"
            },
            "member_2": {
              "name": "صائمة أمين خواجة",
              "title": "نائب الرئيس – الشمال",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ صائمة أمين خواجة"
            },
            "member_3": {
              "name": "أسفند يار علي خان",
              "title": "نائب الرئيس – الشمال",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ أسفند يار علي خان"
            },
            "member_4": {
              "name": "سعيد حبيب",
              "title": "نائب الرئيس – الجنوب",
              "badges": {
                "executive_team": "الفريق التنفيذي"
              },
              "aria_label": "عرض الملف الشخصي لـ سعيد حبيب"
            },
            "member_5": {
              "name": "شبانة علي",
              "title": "نائب الرئيس – الجنوب",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "pma_accredited": "وسيط معتمد من PMA"
              },
              "aria_label": "عرض الملف الشخصي لـ شبانة علي"
            },
            "member_6": {
              "name": "وجيهة عليم",
              "title": "الأمين العام",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ وجيهة عليم"
            },
            "member_7": {
              "name": "سيد صمد الحق",
              "title": "الأمين المالي",
              "badges": {
                "executive_team": "الفريق التنفيذي"
              },
              "aria_label": "عرض الملف الشخصي لـ سيد صمد الحق"
            },
            "member_8": {
              "name": "طارق سعيد رانا",
              "title": "اللجنة التنفيذية – الشمال",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ طارق سعيد رانا"
            },
            "member_9": {
              "name": "هما شاه",
              "title": "اللجنة التنفيذية – الشمال",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ هما شاه"
            },
            "member_10": {
              "name": "أميمة أنور خان",
              "title": "اللجنة التنفيذية – الجنوب",
              "badges": {
                "executive_team": "الفريق التنفيذي"
              },
              "aria_label": "عرض الملف الشخصي لـ أميمة أنور خان"
            },
            "member_11": {
              "name": "مستنصر ذاكر",
              "title": "اللجنة التنفيذية – الجنوب",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ مستنصر ذاكر"
            },
            "member_12": {
              "name": "عدنان مفتي",
              "title": "اللجنة التنفيذية – الجنوب",
              "badges": {
                "executive_team": "الفريق التنفيذي",
                "mediator": "وسيط",
                "cedr_accredited": "وسيط معتمد من CEDR"
              },
              "aria_label": "عرض الملف الشخصي لـ عدنان مفتي"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "مستنصر ذاكر",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "director_training": "مدير التدريب",
                "ex_president": "الرئيس السابق"
              },
              "aria_label": "عرض الملف الشخصي لـ مستنصر ذاكر"
            },
            "trainer_2": {
              "name": "أنور كاشف ممتاز",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "ex_president": "الرئيس السابق",
                "leadership_trainer": "مدرب القيادة"
              },
              "aria_label": "عرض الملف الشخصي لـ أنور كاشف ممتاز"
            },
            "trainer_3": {
              "name": "طارق سعيد رانا",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "ex_president": "الرئيس السابق",
                "executive_committee_north": "اللجنة التنفيذية – الشمال"
              },
              "aria_label": "عرض الملف الشخصي لـ طارق سعيد رانا"
            },
            "trainer_4": {
              "name": "صائمة أمين خواجة",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "executive_member": "عضو تنفيذي",
                "vice_president_north": "نائب الرئيس – الشمال"
              },
              "aria_label": "عرض الملف الشخصي لـ صائمة أمين خواجة"
            },
            "trainer_5": {
              "name": "هما شاه",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "executive_committee_north": "اللجنة التنفيذية – الشمال",
                "training_committee": "لجنة التدريب"
              },
              "aria_label": "عرض الملف الشخصي لـ هما شاه"
            },
            "trainer_6": {
              "name": "عثمان جي راشد",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "barrister_at_law": "محامٍ مستشار (باريسر)",
                "former_secretary_general": "الأمين العام السابق – PMA"
              },
              "aria_label": "عرض الملف الشخصي لـ عثمان جي راشد"
            },
            "trainer_7": {
              "name": "أسفند يار علي خان",
              "title": "مدرب رئيسي",
              "badges": {
                "master_trainer": "مدرب رئيسي",
                "executive_leadership": "القيادة التنفيذية",
                "vice_president_north": "نائب الرئيس – الشمال"
              },
              "aria_label": "عرض الملف الشخصي لـ أسفند يار علي خان"
            }
          },
          "modal": {
    "about_label": "نبذة عن",
    "expertise_title": "الخبرة",
    "training_expertise_title": "خبرات التدريب",
    "accreditations_title": "الاعتمادات",
    "education_title": "التعليم",
    "affiliations_title": "الانتماءات المهنية",
    "media_title": "الإعلام والمشاركة العامة",
    "coming_soon": "قريباً",
    "profile_close_label": "إغلاق الملف الشخصي"
  },
  "profile_modal": {
    "aga_zafar_ahmed": {
    "name": "آغا ظفر أحمد",
    "role": "الرئيس",
    "highlight": "\"النهوض بالوساطة وتسوية النزاعات الدولية من خلال القيادة والمناصرة والتميز في الوسائل البديلة لتسوية النزاعات.\"",
    "about": "السيد آغا ظفر أحمد هو رئيس جمعية المصلحين والوسطاء الباكستانية (PMA) ومحامٍ بارز لدى المحكمة العليا في باكستان مع أكثر من 21 عاماً من الممارسة القانونية. وهو معروف على نطاق واسع بخبرته في القانون البحري والنزاعات التجارية وشؤون التجارة الدولية والوسائل البديلة لتسوية النزاعات (ADR). وبصفته عضواً مؤسساً في جمعية PMA، فإنه يستمر في لعب دور رائد في تطوير ممارسات الوساطة والتسوية السلمية للنزاعات في جميع أنحاء باكستان.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "القيادة التنفيذية"],
    "expertise": ["النزاعات التجارية", "القانون البحري", "نزاعات التجارة الدولية", "الوساطة في الشركات", "التقاضي المدني", "الوسائل البديلة لتسوية النزاعات (ADR)"],
    "experience": { "years": "21+ عاماً", "label": "الممارسة القانونية وتسوية النزاعات" },
    "accreditations": ["وسيط معتمد من CEDR (لندن)", "وسيط معتمد لدى MICADR", "وسيط معتمد من PMA", "دبلوم في قانون التحكيم الدولي"],
    "education": ["دبلوم في قانون التحكيم الدولي – كلية الحقوق، إنجلترا وويلز"],
    "affiliations": ["جمعية نقابة المحامين بالمحكمة العليا في باكستان", "جمعية نقابة محامي المحكمة العليا في السند", "جمعية المصلحين والوسطاء الباكستانية (عضو مؤسس)", "جامعة بحرية (أستاذ زائر سابق)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "صائمة أمين خواجة",
    "role": "نائب الرئيس – الشمال",
    "highlight": "\"تعزيز الإصلاح القانوني والتميز في الوساطة وتسوية النزاعات المستدامة من خلال التعليم والقيادة المؤسسية.\"",
    "about": "السيدة صائمة أمين خواجة هي نائب الرئيس – الشمال لجمعية المصلحين والوسطاء الباكستانية (PMA) ومحترفة قانونية بارعة تتمتع بخبرة واسعة في تقاضي الشركات والقانون الدستوري والاستشارات التعاقدية واستشارات الإصلاح القانوني. وهي وسيطة مدربة دولياً ومدربة ماستر مع التزام قوي بتطوير الوسائل البديلة لتسوية النزاعات والقانون البيئي والتعليم القانوني المهني في باكستان.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "لجنة التدريب"],
    "expertise": ["تقاضي الشركات", "القانون الدستوري", "الإصلاحات القانونية والاستشارات", "القانون البيئي", "التدريب على الوساطة وADR", "سياسة تغير المناخ"],
    "experience": { "years": "20+ عاماً", "label": "الممارسة القانونية والتدريب والاستشارات" },
    "accreditations": ["وسيط معتمد من CEDR", "مدرب ماستر معتمد من CEDR", "وسيط معتمد من PMA", "تدريب القانون البيئي – مؤسسة م. ج. ميهتا، الهند"],
    "education": ["ماجستير في القانون (LL.M) – كينجز كوليدج لندن"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية", "لجنة تغير المناخ – محكمة لاهور العليا", "أكاديمية الخدمة المدنية", "الأكاديمية القضائية", "جامعة لاهور للعلوم الإدارية (LUMS)", "كلية جامعة لاهور (UCL)", "معهد الدراسات القانونية (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "أسفند يار علي خان",
    "role": "نائب الرئيس – الشمال",
    "highlight": "\"تطوير الوساطة والتحكيم والإصلاح القانوني من خلال القيادة والتدريب والخبرة المؤسسية.\"",
    "about": "الباريسير أسفند يار علي خان هو نائب الرئيس – الشمال لجمعية المصلحين والوسطاء الباكستانية (PMA) وعضو مؤسس في الجمعية. تم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون الموقرة، وهو ممارس بارع في القانون والتنمية وذو خبرة واسعة في الوساطة والتحكيم والقانون البيئي والمسائل التنظيمية. يساهم بنشاط في تعزيز ممارسات ADR ومبادرات الإصلاح القانوني في جميع أنحاء باكستان.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "لجنة قواعد السلوك"],
    "expertise": ["التحكيم وADR", "قانون العمل والتوظيف", "القانون البيئي", "النزاعات العائلية والعقارية", "المسائل التنظيمية", "التدريب على الوساطة"],
    "experience": { "years": "20+ عاماً", "label": "الممارسة القانونية، ADR وقيادة اللجان القضائية" },
    "accreditations": ["وسيط معتمد من CEDR", "مدرب ماستر معتمد من CEDR", "عضو – المعهد المعتمد للمحكمين (MCIArb)، لندن", "وسيط معتمد من PMA"],
    "education": ["دبلوم الدراسات العليا في المهارات القانونية المهنية – ذا سيتي سانت جورج، المملكة المتحدة", "بكالوريوس في القانون (Hons) – جامعة هال، المملكة المتحدة", "ماجستير فلسفة – باكستان", "ماجستير – باكستان", "بكالوريوس – باكستان"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (عضو مؤسس)", "المعهد المعتمد للمحكمين، لندن", "محكمة حماية البيئة في خيبر بختونخوا", "جمعية لينكون، لندن"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "وجيهة عليم",
    "role": "الأمين العام",
    "highlight": "\"النهوض بالوساطة من خلال القيادة والابتكار والتعاون الدولي من أجل إطار عمل أقوى للوسائل البديلة لتسوية النزاعات في باكستان.\"",
    "about": "تشغل السيدة وجيهة عليم منصب الأمين العام لجمعية المصلحين والوسطاء الباكستانية (PMA)، حيث تقود المبادرات الاستراتيجية التي تركز على تعزيز الوساطة ومأسسة الوسائل البديلة لتسوية النزاعات (ADR) في جميع أنحاء باكستان. مع أكثر من 17 عاماً من الخبرة في الشركات والمجال القانوني، فإنها تلتزم بتطوير الوساطة كآلية موثوقة وسهلة الوصول ومتوافقة عالمياً لتسوية النزاعات من خلال الابتكار وإصلاح السياسات والتعاون القضائي والشراكات الدولية.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "القيادة التنفيذية"],
    "expertise": ["الوسائل البديلة لتسوية النزاعات (ADR)", "الاستشارات القانونية وللشركات", "التدريب على الوساطة", "التطوير المؤسسي", "إصلاح السياسات", "التعاون الدولي في ADR"],
    "experience": { "years": "17+ عاماً", "label": "قيادة الشركات والمجال القانوني وADR" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "وسيط معتمد من PMA", "ممارس دولي في ADR"],
    "education": ["ماجستير في القانون – المملكة المتحدة", "بكالوريوس في القانون (Hons) – جامعة كراتشي"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية", "شبكات الوساطة وADR الدولية", "المبادرات القضائية والمؤسسية لـ ADR"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "آغا ظفر أحمد",
    "role": "مدرب ماستر",
    "highlight": "\"النهوض بالوساطة وتسمية النزاعات الدولية من خلال القيادة والمناصرة والتميز في الوسائل البديلة لتسوية النزاعات.\"",
    "about": "آغا ظفر أحمد محامٍ بارز لدى المحكمة العليا في باكستان، ووسيط معتمد، ومحترف رفيع المستوى في الوسائل البديلة لتسوية النزاعات (ADR) ويتمتع بخبرة واسعة في القانون البحري والتقاضي المدني والنزاعات التجارية وشؤون التجارة الدولية. وبصفته رئيساً لجمعية المصلحين والوسطاء الباكستانية (PMA)، فإنه يواصل لعب دور رئيسي في تعزيز ممارسات الوساطة وتعزيز أطر تسوية النزاعات المؤسسية في باكستان.\n\nوهو وسيط معتمد من CEDR في المملكة المتحدة ويخدم في لجنة المحكمة العليا في السند كوسيط بينما يرتبط أيضاً بالمركز الدولي لمصالح والوسائل البديلة لتسوية النزاعات (MICADR). وبالإضافة إلى ممارسته القانونية، فقد ساهم في التعليم القانوني والتطوير المهني كعضو هيئة تدريس زائر وقائد مؤسسي.",
    "badges": ["مدرب ماستر", "الرئيس", "القيادة التنفيذية"],
    "expertise": ["التدريب على الوساطة وADR", "تسوية النزاعات التجارية", "القانون البحري", "نزاعات التجارة الدولية", "التحكيم وحل النزاعات", "التقاضي المدني وتقاضي الشركات", "تدريب المدربين (TOT)"],
    "experience": { "years": "21+ عاماً", "label": "الممارسة القانونية وتسوية النزاعات" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "وسيط لجنة – محكمة السند العليا", "عضو – المركز الدولي لمصالح وADR (MICADR)", "دبلوم في قانون التحكيم الدولي – إنجلترا وويلز"],
    "education": ["دبلوم في قانون التحكيم الدولي – كلية الحقوق، إنجلترا وويلز"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "المركز الدولي لمصالح وADR (MICADR)", "المحكمة العليا في السند", "جمعية نقابة المحامين بالمحكمة العليا في باكستان", "جمعية نقابة محامي المحكمة العليا في السند", "جامعة بحرية"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "مستنصر ذاكر",
    "role": "مدرب ماستر",
    "highlight": "\"قيادة حوكمة الشركات ومبادرات التدريب على الوساطة من خلال القيادة الاستراتيجية والتميز في ADR.\"",
    "about": "مستنصر ذاكر قائد مؤسسي رفيع المستوى، ووسيط معتمد، ومدرب ADR معترف به دولياً ويتمتع بخبرة واسعة في الإدارة الاستراتيجية وحوكمة الشركات وتسوية النزاعات. يشغل منصب مدير التدريب والعضو التنفيذي لجمعية المصلحين والوسطاء الباكستانية (PMA) ولعب دوراً مهماً في تعزيز الوساطة والتوعية بـ ADR في جميع أنحاء باكستان.\n\nوهو عضو زميل في ICAP وICMAP وICSP، ويعمل حالياً مع مجموعة هاشو كأول رئيس تنفيذي. وقد أكمل شهادة الإدارة الاستراتيجية من جامعة كورنيل بالولايات المتحدة الأمريكية، وتعليم المديرين المعتمدين من المعهد الباكستاني لحوكمة الشركات. وبصفته وسيطاً معتمداً من CEDR ومدرباً ماستر في المملكة المتحدة، فقد ساهم بشكل مكثف في التدريب المهني على الوساطة وتطوير القيادة ومبادرات ADR المؤسسية في باكستان.",
    "badges": ["مدرب ماستر", "مدير التدريب", "اللجنة التنفيذية – الجنوب", "الرئيس السابق"],
    "expertise": ["التدريب على الوساطة وADR", "حوكمة الشركات", "الإدارة الاستراتيجية", "تطوير القيادة التنفيذية", "تسوية النزاعات التجارية", "تدريب المدربين (TOT)", "بناء القدرات المؤسسية"],
    "experience": { "years": "20+ عاماً", "label": "القيادة التنفيذية والتدريب على ADR" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "مدير معتمد – المعهد الباكستاني لحوكمة الشركات", "شهادة الإدارة الاستراتيجية – جامعة كورنيل، الولايات المتحدة الأمريكية"],
    "education": ["زميل – معهد المحاسبين القانونيين في باكستان (ICAP)", "زميل – معهد محاسبي التكاليف والإدارة في باكستان (ICMAP)", "زميل – معهد سكرتيري الشركات في باكستان (ICSP)"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "مجموعة هاشو", "جمعية الفنادق الباكستانية (PHA)", "جمعية البنائين والمطورين الباكستانية (ABAD)", "معهد المحاسبين القانونيين في باكستان (ICAP)", "المعهد الباكستاني لحوكمة الشركات", "صندوق مجلس كراتشي لكشافة البحر"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "وجيهة عليم",
    "role": "مدرب ماستر",
    "highlight": "\"النهوض بالوساطة من خلال القيادة والابتكار والتعاون الدولي من أجل إطار عمل أقوى للوسائل البديلة لتسوية النزاعات في باكستان.\"",
    "about": "وجيهة عليم محامية لدى المحكمة العليا، ووسيطة معتمدة، ومحترفة قانونية تتمتع بخبرة واسعة في عمليات الشركات والاستشارات القانونية والوسائل البديلة لتسوية النزاعات (ADR). تشغل حالياً منصب الأمين العام لجمعية المصلحين والوسطاء الباكستانية (PMA) بينما تشغل أيضاً منصب المدير العام (العمليات والقانونية) في مجموعة هاشو.\n\nوهي حاصلة على ماجستير القانون في القانون التجاري الدولي والوسائل البديلة لتسوية النزاعات من المملكة المتحدة، وهي وسيطة معتمدة من CEDR ولها انتماءات دولية بما في ذلك مركز تايلاند للتحكيم (THAC). وهي مدرجة كـوسيطة لدى المحكمة العليا في السند وتظل مشاركة بنشاط مع الجمعيات القانونية والمهنية الرائدة محلياً ودولياً.",
    "badges": ["مدرب ماستر", "الأمين العام", "القيادة التنفيذية"],
    "expertise": ["التدريب على الوساطة وADR", "القانون التجاري الدولي", "الاستشارات القانونية للشركات", "تسوية النزاعات التجارية", "تطوير ADR المؤسسي", "التدريب على المهارات المهنية", "حل النزاعات"],
    "experience": { "years": "17+ عاماً", "label": "قيادة الشركات والمجال القانوني وADR" },
    "accreditations": ["وسيط معتمد من CEDR", "وسيط لجنة – محكمة السند العليا", "مدرب مشارك – PMA", "عضوية فصل THAC – مركز تايلاند للتحكيم"],
    "education": ["ماجستير في القانون التجاري الدولي وADR – المملكة المتحدة", "بكالوريوس في القانون (Hons) – باكستان"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "مركز تايلاند للتحكيم (THAC)", "المحكمة العليا في السند", "مجلس نقابة محامي السند", "نقابة محامي كراتشي", "نقابة المحامين الدولية", "مجموعة هاشو"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "هما شاه",
    "role": "مدرب ماستر",
    "highlight": "\"تطوير التميز القانوني للشركات والتدريب على الوساطة من خلال القيادة والمناصرة والتوجيه المهني.\"",
    "about": "هما شاه محترفة قانونية ذات خبرة عالية، ومستشارة شركات، ومدربة ADR معتمدة تتمتع بأكثر من ثلاثة عقود من الممارسة القانونية. منذ عام 1993، عملت مع بعض أبرز المؤسسات القانونية في باكستان بما في ذلك خلية المساعدة القانونية AGHS، ومؤسسة AGHS للمحاماة تحت إشراف السيدة أسماء جهانجير والسيدة هنا جيلاني، ومؤسسة Surridge & Beecheno.\n\nوقد شغلت منصب شريك إداري في SSR&I وتشغل حالياً منصب رئيس الشؤون القانونية – الشمال في بنك حبيب المحدود (HBL). وهي مدربة معتمدة لبرنامج التدريب على المناصرة في باكستان تحت رعاية لجنة الدفاع التابعة لمجلس نقابة المحامين في إنجلترا وويلز (IATC)، ووسيطة ومدربة ماستر معتمدة من CEDR في المملكة المتحدة.",
    "badges": ["مدرب ماستر", "اللجنة التنفيذية – الشمال", "لجنة التدريب"],
    "expertise": ["التدريب على الوساطة وADR", "قانون الشركات والقانون التجاري", "التدريب على المناصرة والمهارات القانونية", "صياغة وتدقيق العقود", "الاستشارات القانونية المصرفية وللشركات", "حل النزاعات", "تدريب المدربين (TOT)"],
    "experience": { "years": "30+ عاماً", "label": "الممارسة القانونية واستشارات الشركات والتدريب على ADR" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "مدرب معتمد – برنامج التدريب على المناصرة في باكستان (IATC)"],
    "education": ["كلية البنجاب للحقوق – حصلت على ميداليات ذهبية مرتين للتفوق الأكاديمي"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "لجنة الدفاع التابعة لمجلس نقابة المحامين (IATC)", "مجلس نقابة المحامين في إنجلترا وويلز", "بنك حبيب المحدود (HBL)", "نقابات محامي البنجاب", "خلية المساعدة القانونية AGHS", "مؤسسة Surridge & Beecheno"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "عثمان ج. راشد",
    "role": "مدرب ماستر",
    "highlight": "\"الجمع بين الدفاع القانوني وخبرة الوساطة وقيادة التدريب لبناء قدرات ADR في جميع أنحاء باكستان.\"",
    "about": "عثمان ج. راشد باريسر في القانون، ومحامٍ لدى المحاكم العليا، ووسيط معتمد من CEDR، ومدرب ماستر يتمتع بخبرة واسعة في الممارسة القانونية، والتدريب على الدفاع، والوساطة، والتعليم القانوني. وهو حاصل على بكالوريوس في القانون (Hons) من جامعة لندن، وماجستير في القانون من كينجز كوليدج لندن، وأكمل الدورة المهنية للمحاماة من جامعة غرب إنجلترا، بريستول، المملكة المتحدة. تم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون الموقرة.\n\nوقد شغل سابقاً منصب الأمين العام لجمعية المصلحين والوسطاء الباكستانية (PMA) وساهم بنشاط في نشر الوعي بالوساطة، وبناء قدرات ADR، ومبادرات التدريب القانوني المهني في باكستان. وإلى جانب ممارسته القانونية، فهو يشارك في التعليم القانوني والتدريب على الدفاع، وخاصة في قانون الشركات وقانون الأدلة للبرنامج الخارجي لجامعة لندن.\n\nبدأ عثمان مسيرته المهنية مع عمر بانديال وشركائه ويدير حالياً ممارسته القانونية من خلال غرف عناية الله والمحامين والمستشارين القانونيين. تمكنه خبرته المشتركة في التقاضي، وADR، والتعليم القانوني، والتدريب على الدفاع من المساهمين بشكل فعال في تطوير ADR المؤسسي وممارسات الوساطة المهنية.",
    "badges": ["مدرب ماستر", "باريسر في القانون", "الأمين العام السابق – PMA"],
    "expertise": ["التدريب على الوساطة وADR", "التدريب على مهارات الدفاع", "قانون الشركات", "قانون الأدلة", "التقاضي التجاري والمدني", "التعليم القانوني والتطوير المهني", "حل النزاعات"],
    "experience": { "years": "15+ عاماً", "label": "مدرب ماستر معتمد من CEDR، الدفاع والتعليم القانوني" },
    "accreditations": ["وسيط ومدرب ماستر معتمد من CEDR – المملكة المتحدة", "باريسر في القانون – جمعية لينكون", "مدرب دفاع معتمد"],
    "education": ["ماجستير في القانون – كينجز كوليدج، جامعة لندن", "بكالوريوس في القانون (Hons) – جامعة لندن", "الدورة المهنية للمحاماة – جامعة غرب إنجلترا، بريستول، المملكة المتحدة."],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "جمعية لينكون الموقرة", "كلية جامعة لاهور", "البرنامج الخارجي لجامعة لندن", "غرف عناية الله والمحامين والمستشارين القانونيين"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "أسفند يار علي خان",
    "role": "مدرب ماستر",
    "highlight": "\"تطوير الوساطة والتحكيم والإصلاح القانوني من خلال القيادة والتدريب والخبرة المؤسسية.\"",
    "about": "أسفند يار علي خان ممارس قانوني رفيع المستوى، ووسيط معتمد، وخبير ADR مدرب دولياً يتمتع بخبرة واسعة في الاستشارات القانونية، والتحكيم، والتطوير المؤسسي، والتدريب على الوساطة. وبصفته شريكاً أول في شراكة S&K ونائب رئيس جمعية المصلحين والوسطاء الباكستانية (PMA)، فإنه يساهم بنشاط في تعزيز أطر الوساطة والوسائل البديلة لتسوية النزاعات في باكستان.\n\nتم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون في لندن، وهو وسيط ومدرب ماستر معتمد من CEDR في المملكة المتحدة وعضو في المعهد المعتمد للمحكمين (MCIArb) في لندن. تمتد خلفيته المهنية عبر الممارسة القانونية، ومبادرات التنمية الدولية، والمشاركة في السياسات، والأدوار الاستشارية المؤسسية بما في ذلك العمل مع الأمم المتحدة ومشاريع برنامج الأمم المتحدة الإنمائي (UNDP).",
    "badges": ["مدرب ماستر", "القيادة التنفيذية", "نائب الرئيس – الشمال"],
    "expertise": ["التدريب على الوساطة وADR", "التحكيم وحل النزاعات", "النزاعات التجارية والمدنية", "تطوير المهارات القانونية", "بناء قدرات ADR المؤسسية", "برامج التطوير المهني", "تدريب المدربين (TOT)"],
    "experience": { "years": "20+ عاماً", "label": "الممارسة القانونية، ADR وقيادة اللجان القضائية" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "عضو – المعهد المعتمد للمحكمين (MCIArb)، لندن", "باريسر في القانون – جمعية لينكون، لندن"],
    "education": ["دبلوم الدراسات العليا في المهارات القانونية المهنية – المملكة المتحدة", "بكالوريوس في القانون (Hons) – المملكة المتحدة", "ماجستير – باكستان", "بكالوريوس – باكستان"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "المعهد المعتمد للمحكمين، لندن", "جمعية لينكون، لندن", "جمعية الهلال الأحمر الباكستاني (PRCS)", "الجمعية الباكستانية للقانون البيئي", "جمعية الخريجين البريطانيين", "مبادرات التنمية التابعة للأمم المتحدة"],
    "media": []
  },
    "trainer_saima_amin_khawaja": {
    "name": "صائمة أمين خواجة",
    "role": "مدرب ماستر",
    "highlight": "\"تعزيز الإصلاح القانوني والتميز في الوساطة وتسوية النزاعات المستدامة من خلال التعليم والقيادة المؤسسية.\"",
    "about": "الصائمة أمين خواجة هي محترفة قانونية بارعة، ووسيطة معتمدة، وخبيرة في الوسائل البديلة لتسوية النزاعات (ADR) مدربة دولياً وتتمتع بخبرة واسعة في تقاضي الشركات، والقانون الدستوري، والاستشارات القانونية، والإصلاح المؤسسي. وقد لعبت دوراً رئيسياً في تعزيز الوعي بالوساطة، والتدريب على ADR، ومبادرات التطوير القانوني في باكستان.\n\nوهي حاصلة على ماجستير في القانون (LL.M) من كينجز كوليدج لندن وتلقت تدريباً متخصصاً في القوانين البيئية من مؤسسة م. ج. ميهتا في الهند. وبصفتها وسيطة معتمدة ومدربة ماستر من CEDR في المملكة المتحدة، فقد ساهمت بنشاط في التدريب المهني على الوساطة وبرامج بناء القدرات. وقد قامت بالتدريس في جامعة لاهور للعلوم الإدارية (LUMS)، وأكاديمية الخدمة المدنية، والأكاديمية القضائية، ومعهد الدراسات القانونية (TILS)، وكلية جامعة لاهور (UCL)، بالإضافة إلى عملها في لجنة تغير المناخ التي شكلتها محكمة لاهور العليا.",
    "badges": ["مدرب ماستر", "عضو تنفيذي", "نائب الرئيس – الشمال"],
    "expertise": ["التدريب على الوساطة وADR", "قانون الشركات والقانون الدستوري", "الإصلاحات القانونية وتطوير السياسات", "القانون البيئي", "التدريب القضائي والمهني", "حل النزاعات", "تدريب المدربين (TOT)"],
    "experience": { "years": "20+ عاماً", "label": "الممارسة القانونية والتدريب والاستشارات" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "تدريب متخصص في القانون البيئي – مؤسسة م. ج. ميهتا، الهند"],
    "education": ["ماجستير في القانون (LL.M) – كينجز كوليدج لندن"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "محكمة لاهور العليا", "جامعة لاهور للعلوم الإدارية (LUMS)", "أكاديمية الخدمة المدنية", "الأكاديمية القضائية", "معهد الدراسات القانونية (TILS)", "كلية جامعة لاهور (UCL)", "مؤسسة م. ج. ميهتا، الهند"],
    "media": []
  },
  "trainer_tariq_saeed_rana": {
    "name": "طارق سعيد رانا",
    "role": "مدرب ماستر",
    "highlight": "\"قيادة ممارسة قانون الشركات والتميز في الوساطة من خلال الخبرة الدولية والتدريب المهني وقيادة ADR.\"",
    "about": "طارق سعيد رانا هو مستشار قانوني رفيع المستوى، ووسيط معتمد، ومدرب ADR معترف به دولياً ويتمتع بخبرة واسعة في قانون الشركات والقانون التجاري. تم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون الموقرة في المملكة المتحدة، وهو يترأس حالياً قسم قانون الشركات والقانون التجاري في مؤسسة Surridge & Beecheno ويواصل المساهمة بشكل كبير في التدريب على الوساطة والاستشارات القانونية والتطوير المؤسسي لـ ADR في باكستان.\n\nوهو وسيط معتمد ومدرب ماستر من CEDR في المملكة المتحدة وله خبرة واسعة في حوكمة الشركات والاستشارات القانونية وبناء القدرات المهنية. يقود بنشاط برامج تدريب المهن وتدريب أعضاء مجالس الإدارة مع الحفاظ على أدوار قيادية داخل المؤسسات القانونية والتجارية.",
    "badges": ["مدرب ماستر", "رئيس سابق", "اللجنة التنفيذية – الشمال"],
    "expertise": ["التدريب على الوساطة وADR", "قانون الشركات والقانون التجاري", "برامج تدريب أعضاء مجالس الإدارة", "حوكمة الشركات", "تسوية النزاعات التجارية", "التطوير القانوني المهني", "تدريب المدربين (TOT)"],
    "experience": { "years": "25+ عاماً", "label": "الممارسة القانونية، ADR والاستشارات الشركاتية" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "مستدعى إلى نقابة المحامين – جمعية لينكون، المملكة المتحدة"],
    "education": ["ماجستير في القوانين التجارية – المملكة المتحدة", "دبلوم الدراسات العليا في القانون – المملكة المتحدة", "بكالوريوس في القانون – باكستان", "دبلوم في الهندسة الميكانيكية – باكستان"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "جمعية لينكون الموقرة، لندن", "المجلس العام لنقابة المحامين في إنجلترا وويلز", "جمعية نقابة محامي محكمة لاهور العليا", "مجلس نقابة محامي البنجاب", "غرفة تجارة وصناعة لاهور", "مؤسسة Surridge & Beecheno"],
    "media": []
  },
  "saeed_habib": {
    "name": "سعيد حبيب",
    "role": "نائب الرئيس – الجنوب",
    "highlight": "",
    "about": "",
    "badges": ["لجنة العضوية", "التنسيق المؤسسي"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "shabana_ali": {
    "name": "شبانة علي",
    "role": "نائب الرئيس – الجنوب",
    "highlight": "\"تعزيز الوساطة والوعي القانوني والعدالة الاجتماعية من خلال المناصرة والتعليم وحل النزاعات.\"",
    "about": "السيدة شبانة علي هي نائب الرئيس – الجنوب لجمعية المصلحين والوسطاء الباكستانية (PMA) ومحامية متمرسة في القانون المدني والضريبي وقانون الشركات وتتمتع بخلفية قوية في التقاضي والخدمات الاستشارية وتسوية النزاعات. وهي تشارك بنشاط في تطوير ممارسات الوساطة في باكستان ومعترف بها على نطاق واسع لالتزامها بالتمكين القانوني والعدالة الاجتماعية وحماية حقوق المرأة والطفل.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من PMA", "تنسيق نقابة المحامين – الجنوب", "القيادة"],
    "expertise": ["القانون المدني", "قانون الشركات", "النزاعات العائلية", "قانون الضرائب", "الوساطة وADR", "المناصرة لحقوق المرأة والطفل"],
    "experience": { "years": "20+ عاماً", "label": "الممارسة القانونية والوساطة والمناصرة العامة" },
    "accreditations": ["وسيط معتمد من PMA", "ممارس وساطة معتمد"],
    "education": ["الدراسات القانونية والمهنية في القانون المدني والشركات والضرائب"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية", "المعهد الباكستاني لمحاسبي التمويل العام (PIPFA)", "اللجنة التنفيذية – PMA", "محللة قانونية ومتحدثة في وسائل الإعلام"],
    "media": ["تلفزيون باكستان (PTV)", "آج نيوز", "تي في ون", "مترو نيوز"]
  },
  "syed_sammad_ul_haque": {
    "name": "سيد صمد الحق",
    "role": "الأمين المالي",
    "highlight": "",
    "about": "",
    "badges": ["لجنة العضوية", "القيادة التنفيذية"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "tariq_saeed_rana": {
    "name": "طارق سعيد رانا",
    "role": "اللجنة التنفيذية – الشمال",
    "highlight": "\"قيادة ممارسة قانون الشركات والتميز في الوساطة من خلال الخبرة الدولية والتدريب المهني وقيادة ADR.\"",
    "about": "الباريسير طارق سعيد رانا هو محترف قانوني رفيع المستوى، ووسيط معتمد، ومدرب ماستر يتمتع بخبرة واسعة في قانون الشركات والقانون التجاري. تم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون الموقرة في المملكة المتحدة، ويترأس حالياً قسم قانون الشركات والقانون التجاري في مؤسسة Surridge & Beecheno. مع عقود من الخبرة في الاستشارات القانونية، وADR، والتدريب المهني، يواصل لعب دور قيادي هام في تطوير الوساطة والتطوير القانوني المؤسسي في باكستان.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "رئيس سابق"],
    "expertise": ["قانون الشركات والقانون التجاري", "الوساطة وADR", "النزاعات التجارية الدولية", "الاستشارات القانونية", "حوكمة الشركات", "التدريب المهني"],
    "experience": { "years": "25+ عاماً", "label": "الممارسة القانونية، ADR والاستشارات الشركاتية" },
    "accreditations": ["وسيط معتمد من CEDR", "مدرب ماستر معتمد من CEDR", "مستدعى إلى نقابة المحامين – جمعية لينكون، المملكة المتحدة", "وسيط معتمد من PMA"],
    "education": ["ماجستير في القانون (القوانين التجارية) – المملكة المتحدة", "دبلوم الدراسات العليا في القانون – المملكة المتحدة", "بكالوريوس في القانون – باكستان", "دبلوم في الهندسة الميكانيكية – باكستان"],
    "affiliations": ["المجلس العام لنقابة المحامين في إنجلترا وويلز", "جمعية لينكون الموقرة، لندن", "جمعية المصلحين والوسطاء الباكستانية", "جمعية نقابة محامي محكمة لاهور العليا", "مجلس نقابة محامي البنجاب", "غرفة تجارة وصناعة لاهور"],
    "media": []
  },
  "huma_shah": {
    "name": "هما شاه",
    "role": "اللجنة التنفيذية – الشمال",
    "highlight": "\"تطوير التميز القانوني للشركات والتدريب على الوساطة من خلال القيادة والمناصرة والتوجيه المهني.\"",
    "about": "السيدة هما شاه هي محترفة قانونية رفيعة المستوى تتمتع بخبرة واسعة في قانون الشركات والاستشارات القانونية والصياغة التجارية وحل النزاعات. تمارس المهنة منذ عام 1993، وعملت مع مؤسسات قانونية ومكاتب محاماة رائدة بما في ذلك خلية المساعدة القانونية AGHS， ومؤسسة AGHS للمحاماة， وSurridge & Beecheno. تشغل حالياً منصب رئيس الشؤون القانونية – الشمال في بنك HBL وتواصل المساهمة بشكل كبير في التدريب على الوساطة وتطوير ADR في باكستان.",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدرب ماستر", "لجنة التدريب"],
    "expertise": ["قانون الشركات والقانون التجاري", "الاستشارات القانونية", "الصياغة والتدقيق التجاري", "الشؤون القانونية المصرفية والمالية", "الوساطة وADR", "التدريب على المناصرة"],
    "experience": { "years": "30+ عاماً", "label": "الممارسة القانونية واستشارات الشركات والتدريب على ADR" },
    "accreditations": ["وسيط معتمد من CEDR", "مدرب ماستر معتمد من CEDR", "مدرب دفاع معتمد – IATC (مجلس نقابة المحامين في إنجلترا وويلز)", "وسيط معتمد من PMA"],
    "education": ["كلية البنجاب للحقوق – حصلت على ميداليات ذهبية مرتين للتفوق الأكاديمي"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية", "برنامج التدريب على المناصرة التابع لجمعيات المحامين في باكستان", "نقابات محامي البنجاب", "بنك HBL – رئيس الشؤون القانونية في الشمال"],
    "media": []
  },
  "umaimah_anwar_khan": {
    "name": "أميمة أنور خان",
    "role": "اللجنة التنفيذية – الجنوب",
    "highlight": "",
    "about": "",
    "badges": ["قواعد السلوك", "تنسيق نقابة المحامين – الجنوب"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "mustansir_zakir": {
    "name": "مستنصر ذاكر",
    "role": "اللجنة التنفيذية – الجنوب",
    "highlight": "\"قيادة حوكمة الشركات ومبادرات التدريب على الوساطة من خلال القيادة الاستراتيجية والتميز في ADR.\"",
    "about": "السيد مستنصر ذاكر هو قائد مؤسسي رفيع المستوى، ووسيط معتمد، ومدرب ماستر يتمتع بخبرة قيادية واسعة في حوكمة الشركات، والضيافة، والتمويل، والوسائل البديلة لتسوية النزاعات (ADR). يشغل حالياً منصب الرئيس التنفيذي لمجموعة هاشو، ولعب دوراً مهماً في تعزيز الوعي بالوساطة ومبادرات التدريب المهني في باكستان من خلال قيادته داخل جمعية المصلحين والوسطاء الباكستانية (PMA).",
    "badges": ["الفريق التنفيذي", "وسيط", "وسيط معتمد من CEDR", "مدير التدريب", "مدرب ماستر", "رئيس سابق"],
    "expertise": ["حوكمة الشركات", "الإدارة الاستراتيجية", "التدريب على الوساطة وADR", "الضيافة وقيادة الأعمال", "الإدارة المالية", "التطوير المؤسسي"],
    "experience": { "years": "30+ عاماً", "label": "القيادة التنفيذية والحوكمة وADR" },
    "accreditations": ["وسيط معتمد من CEDR", "مدرب ماستر معتمد من CEDR", "تعليم المديرين المعتمدين – PICG", "شهادة الإدارة الاستراتيجية – جامعة كورنيل، الولايات المتحدة الأمريكية"],
    "education": ["زميل – معهد المحاسبين القانونيين في باكستان (ICAP)", "زميل – معهد محاسبي التكاليف والإدارة في باكستان (ICMAP)", "زميل – معهد سكرتيري الشركات في باكستان (ICSP)"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (رئيس سابق ومدير التدريب)", "مجموعة هاشو – الرئيس التنفيذي", "جمعية الفنادق الباكستانية (رئيس سابق)", "جمعية البنائين والمطورين الباكستانية (ABAD)", "صندوق مجلس كراتشي لكشافة البحر – متولي إداري"],
    "media": []
  },
  "usman_g_rashid": {
    "name": "عثمان ج. راشد",
    "role": "عضو",
    "highlight": "\"الجمع بين الدفاع القانوني وخبرة الوساطة وقيادة التدريب لبناء قدرات ADR في جميع أنحاء باكستان.\"",
    "about": "عثمان ج. راشد باريسر في القانون، ومحامٍ لدى المحاكم العليا، ووسيط معتمد من CEDR، ومدرب ماستر يتمتع بخبرة واسعة في الممارسة القانونية، والتدريب على الدفاع، والوساطة، والتعليم القانوني. وهو حاصل على بكالوريوس في القانون (Hons) من جامعة لندن، وماجستير في القانون من كينجز كوليدج لندن، وأكمل الدورة المهنية للمحاماة من جامعة غرب إنجلترا، بريستول، المملكة المتحدة. تم استدعاؤه إلى نقابة المحامين من قبل جمعية لينكون الموقرة.\n\nوقد شغل سابقاً منصب الأمين العام لجمعية المصلحين والوسطاء الباكستانية (PMA) وساهم بنشاط في نشر الوعي بالوساطة، وبناء قدرات ADR، ومبادرات التدريب القانوني المهني في باكستان. وإلى جانب ممارسته القانونية، فهو يشارك في التعليم القانوني والتدريب على الدفاع، وخاصة في قانون الشركات وقانون الأدلة للبرنامج الخارجي لجامعة لندن.\n\nبدأ عثمان مسيرته المهنية مع عمر بانديال وشركائه ويدير حالياً ممارسته القانونية من خلال غرف عناية الله والمحامين والمستشارين القانونيين. تمكنه خبرته المشتركة في التقاضي، وADR، والتعليم القانوني، والتدريب على الدفاع من المساهمين بشكل فعال في تطوير ADR المؤسسي وممارسات الوساطة المهنية.",
    "badges": ["وسيط", "مدرب ماستر", "باريسر في القانون"],
    "expertise": ["التدريب على الوساطة وADR", "التدريب على مهارات الدفاع", "قانون الشركات", "قانون الأدلة", "التقاضي التجاري والمدني", "التعليم القانوني والتطوير المهني", "حل النزاعات"],
    "experience": { "years": "", "label": "وسيط ومدرب ماستر معتمد من CEDR" },
    "accreditations": ["وسيط ومدرب ماستر معتمد من CEDR – المملكة المتحدة", "باريسر في القانون – جمعية لينكون", "مدرب دفاع معتمد"],
    "education": ["ماجستير في القانون – كينجز كوليدج، جامعة لندن", "بكالوريوس في القانون (Hons) – جامعة لندن", "الدورة المهنية للمحاماة – جامعة غرب إنجلترا، بريستول، المملكة المتحدة."],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "جمعية لينكون الموقرة", "كلية جامعة لاهور", "البرنامج الخارجي لجامعة لندن", "غرف عناية الله والمحامين والمستشارين القانونيين"],
    "media": []
  },
  "adnan_mufti": {
    "name": "عدنان مفتي",
    "role": "اللجنة التنفيذية – الجنوب",
    "highlight": "",
    "about": "",
    "badges": ["التنسيق المؤسسي", "القيادة"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "anwar_kashif_mumtaz": {
    "name": "أنور كاشف ممتاز",
    "role": "مدرب ماستر",
    "highlight": "",
    "about": "أنور كاشف ممتاز هو محترف قانوني رفيع المستوى، ومدرب قيادة، ووسيط معتمد يتمتع بخبرة واسعة في ممارسات الشركات والضرائب وحل النزاعات. وبصفته محامياً لدى المحكمة العليا وشريكاً أول في مؤسسة Saiduddin & Co.، فقد بنى سمعة قوية في تقديم الاستشارات في قانون الضرائب والشركات في باكستان.\n\nوهو مدرب معتمد دولياً في القيادة والتطوير الشخصي ووسيط ومدرب ماستر معتمد من CEDR في المملكة المتحدة. وقد ساهم بشكل كبير في تطوير القيادة، والوعي بالوساطة، وبناء القدرات المهنية في القطاعات القانونية والمؤسسية. كما شغل مناصب قيادية بارزة بما في ذلك الأمين العام ونائب الرئيس ورئيس نقابة محامين الضرائب في باكستان ونقابة محامين الضرائب في كراتشي.",
    "badges": ["مدرب ماستر", "رئيس سابق", "مدرب قيادة"],
    "expertise": ["القيادة والتطوير الشخصي", "التدريب على الوساطة وADR", "قانون الشركات", "قانون الضرائب والاستشارات", "برامج التطوير المهني", "حل النزاعات", "تدريب المدربين (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["وسيط معتمد من CEDR في المملكة المتحدة", "مدرب ماستر معتمد من CEDR في المملكة المتحدة", "مدرب دولي معتمد – القيادة والتطوير الشخصي"],
    "education": ["محامٍ، المحكمة العليا في باكستان"],
    "affiliations": ["جمعية المصلحين والوسطاء الباكستانية (PMA)", "CEDR المملكة المتحدة", "نقابة محامين الضرائب في باكستان", "نقابة محامين الضرائب في كراتشي", "جمعية المصلحة العامة القانونية الباكستانية (PILAP)", "مؤسسة ميسرز سعيد الدين وشركائه"],
    "media": []
  }
  },
          "former_presidents": {
            "president_1": {
              "name": "أنور كاشف ممتاز",
              "title": "الرئيس السابق"
            },
            "president_2": {
              "name": "مستنصر ذاكر",
              "title": "الرئيس السابق"
            },
            "president_3": {
              "name": "طارق سعيد رانا",
              "title": "الرئيس السابق"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "اللجنة الفرعية",
              "subtitle": "تقود لجاننا الفرعية المبادرات الرئيسية وتدعم مهمة PMA من خلال الخبرة والتعاون والخدمة المخصصة.",
              "expand_all": "توسيع الكل"
            },
            "labels": {
              "mandate": "الولاية / المهام:",
              "director": "مدير",
              "convener": "منسق"
            },
            "committees": {
              "training": {
                "title": "لجنة التدريب",
                "mandate": "التوجيه، التدريب، الشهادات/الاعتماد/الدورات التنشيطية/تدريب المدربين (TOT)",
                "lead_name": "مستنصر ذاكر",
                "members": [
                  "أنور كاشف ممتاز",
                  "صائمة خواجة",
                  "طارق رانا",
                  "هما شاه",
                  "اسفنديار علي خان"
                ]
              },
              "conduct": {
                "title": "لجنة قواعد السلوك",
                "mandate": "صياغة قواعد السلوك للمصالحين والسعي للحصول على موافقة وزارة العدل لتطبيقها في جميع أنحاء البلاد",
                "lead_name": "أميمة خان",
                "members": [
                  "أنور كاشف ممتاز",
                  "صائمة خواجة",
                  "خالد محمود",
                  "عدنان مفتي",
                  "طارق رانا",
                  "اسفنديار علي خان"
                ]
              },
              "membership": {
                "title": "لجنة العضوية",
                "mandate": "الاحتفاظ بالعضوية القديمة وتنشيطها، وتوسيع محفظة العضوية من خلال دعوة المصالحين المعتمدين من المعاهد الأخرى وأيضاً ضم أعضاء منتسبين وأعضاء شرفيين.",
                "lead_name": "سعيد حبيب",
                "members": [
                  "خالد محمود",
                  "صائمة خواجة",
                  "صمد الحق",
                  "اسفنديار علي خان"
                ]
              },
              "bar_south": {
                "title": "التنسيق القانوني والأكاديمي – الجنوب",
                "mandate": "التنسيق مع نقابة المحامين/مجلس المحامين وكليات الحقوق لتنظيم الاجتماعات والندوات واللقاءات التوجيهية والدورات التدريبية/ورش العمل",
                "lead_name": "شبانه علي",
                "members": [
                  "سعادة يار خان",
                  "أميمة خان",
                  "السيدة خالد محمود",
                  "صمد الحق",
                  "منصور مير",
                  "نويد أحمد"
                ]
              },
              "bar_north": {
                "title": "التنسيق القانوني والأكاديمي – الشمال",
                "mandate": "التنسيق مع نقابة المحامين/مجلس المحامين وكليات الحقوق لتنظيم الاجتماعات والندوات واللقاءات التوجيهية والدورات التدريبية/ورش العمل",
                "lead_name": "صائمة خواجة",
                "members": [
                  "ظفر كالاناوري",
                  "المحامي طارق رانا",
                  "اسفنديار علي خان"
                ]
              },
              "institutional": {
                "title": "لجنة التنسيق المؤسسي",
                "mandate": "التنسيق مع الغرف التجارية والكيانات التجارية والجمعيات/المعاهد المهنية",
                "lead_name": "عدنان مفتي",
                "members": [
                  "مستنصر ذاكر",
                  "سعيد حبيب",
                  "طارق رانا",
                  "اسفنديار علي خان",
                  "صمد الحق"
                ]
              }
            },
            "footer_note": "آغا ظفر أحمد (الرئيس) ووجيهة عليم (الأمين العام) هما عضوان بحكم المنصب في كل لجنة."
          },
          "mediators": {
            "adnan-mufti": { "name": "عدنان مفتي", "role": "عضو" },
            "anwar-kashif-mumtaz": { "name": "أنور كاشف ممتاز", "role": "عضو" },
            "ayesha-sarfraz-ali-khan": { "name": "عائشة سرفراز علي خان", "role": "عضو" },
            "barrister-tariq-saeed-lahore": { "name": "المحامي طارق سعيد", "role": "عضو" },
            "farrukh-junaidy": { "name": "فرخ جنيدي", "role": "عضو" },
            "huma-shah": { "name": "هما شاه", "role": "عضو" },
            "ishtiaq-memon": { "name": "اشتياق ميمون", "role": "عضو" },
            "isfandyar-ali-khan": { "name": "اسفنديار علي خان", "role": "عضو" },
            "khalid-firoz-arfeen": { "name": "خالد فيروز عارفين", "role": "عضو" },
            "khalid-mahmood-siddiqui": { "name": "خالد محمود صديقي", "role": "عضو" },
            "mohammad-rehan-siddqui": { "name": "محمد ريحان صديقي", "role": "عضو" },
            "mustansir-zakir": { "name": "مستنصر ذاكر", "role": "عضو" },
            "nausheen-ahmed": { "name": "نوشين أحمد", "role": "عضو" },
            "neelofar-hameed": { "name": "نيلوفر حميد", "role": "عضو" },
            "omair-nisar-khan": { "name": "عمير نثار خان", "role": "عضو" },
            "raheem-hasnani": { "name": "رحيم حسناني", "role": "عضو" },
            "reshma-aftab": { "name": "ريشما آفتاب", "role": "عضو" },
            "rubina-virani": { "name": "روبينا فيراني", "role": "عضو" },
            "saadat-yar-khan": { "name": "سعادة يار خان", "role": "عضو" },
            "saeed-habib": { "name": "سعيد حبيب", "role": "عضو" },
            "saima-khawaja": { "name": "صائمة أمين خواجة", "role": "عضو" },
            "salina-khalfan": { "name": "سالينا خلفان", "role": "عضو" },
            "shabana-ali": { "name": "شبانه علي", "role": "عضو" },
            "shaheen-premani": { "name": "شاهين بريماني", "role": "عضو" },
            "syed-haider-imam-rizvi": { "name": "سيد حيدر إمام رضوي", "role": "عضو" },
            "syed-sammadul-haque": { "name": "سيد صمد الحق", "role": "عضو" },
            "tahmasp-r-razvi": { "name": "طهمسب آر رضوي", "role": "عضو" },
            "umaimah-a-rizvi": { "name": "أميمة أ رضوي", "role": "عضو" },
            "usman-g-rashid": { "name": "عثمان جي راشد", "role": "عضو" },
            "wajiha-aleem": { "name": "وجيهة عليم", "role": "عضو" },
            "yousuf-moulvi": { "name": "يوسف مولوي", "role": "عضو" },
            "zafar-kalanauri": { "name": "ظفر كالاناوري", "role": "عضو" },
            "zia-makhdoom": { "name": "ضياء مخدوم", "role": "عضو" }
          }
        },
        "resources_page": {
          "hero": {
            "image_alt": "صورة بطل الخدمات",
            "eyebrow": "المصادر",
            "title_line1": "المعرفة. القانون.",
            "title_accent": "الإصلاح.",
            "lead_text": "يمكنك الوصول إلى منشورات PMA، وقوانين الوساطة، والوثائق المؤسسية، والأوراق البحثية، ومصادر كسب التأييد، والمحتوى الإعلامي الذي يدعم نمو الحلول البديلة لفض المنازعات (ADR) والتسوية السلمية للنزاعات في باكستان."
          },
          "tabs": {
            "featured": "مميز",
            "downloads": "التنزيلات",
            "mediation_laws": "قوانين الوساطة",
            "advocacy": "المناصرة والتأييد",
            "press_media": "الصحافة والإعلام",
            "articles": "المقالات"
          },
          "downloads_panel": {
            "header": {
              "title": "التنزيلات",
              "lead": "ملفات PDF، ونماذج، ومنشورات قابلة للتنزيل. انقر فوق الملف لفتحه في علامة تبويب جديدة.",
              "view_all_text": "عرض جميع التنزيلات"
            },
            "global_labels": {
              "download_btn_text": "تنزيل PDF",
              "default_image_alt": "ملف ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "قانون الحلول البديلة لفض النزاعات 2017 (ADR-ACT-2017)",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "المناصرة والضغط (Advocacy and Lobby)",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "شهادة التسجيل",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "نموذج طلب العضوية",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "عقد التأسيس المحدث (Memorandum of Association)",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "الترشيح",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "خطاب PMA",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "لماذا تنضم إلى PMA؟",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "قوانين وتطوير تشريعات الوساطة",
              "lead": "القوانين والتشريعات الرئيسية، ومشاريع القوانين، والوثائق التشريعية الرسمية المتعلقة بالوساطة.",
              "view_all_text": "عرض جميع القوانين"
            },
            "global_labels": {
              "download_btn_text": "تنزيل PDF",
              "default_image_alt": "ملف ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "قانون إسلام آباد لفض النزاعات (الوساطة)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "تعديلات في الجدول الأول من قانون الإجراءات المدنية لعام 1908",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "تعديلات البنجاب في قانون الإجراءات المدنية لعام 1908 (أحكام الوساطة)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "مشروع قانون الإجراءات المدنية (تعديل السند) لعام 2018",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "اتفاقية سنغافورة بشأن التسويات المنبثقة عن الوساطة (النص الكامل)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "المناصرة والسياسات",
              "lead": "موجزات السياسات، ومجموعات أدوات المناصرة، وأوراق الموقف لدعم إصلاح الحلول البديلة لفض النزاعات.",
              "view_all_text": "عرض جميع مواد المناصرة"
            },
            "global_labels": {
              "download_btn_text": "تنزيل PDF",
              "default_image_alt": "ملف ADR-ACT-2017 PDF"
            },
            "items": {
              "card_1": {
                "title": "خيبر بختونخوا (KPK)",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "البنجاب",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "السند",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "الصحافة والإعلام",
              "lead": "البيانات الصحفية، والملفات الإعلامية، والمواد القابلة للتنزيل للصحفيين.",
              "view_all_text": "عرض المواد الإعلامية"
            },
            "global_labels": {
              "download_btn_text": "تنزيل PDF",
              "default_image_alt": "ملف PDF"
            },
            "items": {
              "card_1": {
                "title": "بيزنس ريكوردر (Business Recorder)",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "إعلان بيزنس ريكوردر (AD)",
                "file_name": ""
              },
              "card_3": {
                "title": "فرونتير بوست (Frontier Post)",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "باكستان أوبسيرفر (Pakistan Observer)",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "البيان الصحفي لـ PMA",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "صحيفة التريبيون (Tribune)",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "المقالات والتحليلات",
              "lead": "المقالات البحثية والتحليلات والرؤى القيادية الفكرية حول الوساطة والحلول البديلة لفض النزاعات.",
              "view_all_text": "عرض جميع المقالات"
            },
            "global_labels": {
              "download_btn_text": "تنزيل PDF",
              "author_prefix": "بقلم"
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "جواد أ. سرونة",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "ملف It Really Happened in Frankfurt PDF"
              },
              "card_2": {
                "title": "Mediation Techniques (تقنيات الوساطة)",
                "author": "جواد أ. سرونة",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "ملف Mediation Techniques PDF"
              }
            }
          },
          "search_bar": {
            "question": "لم تجد ما تبحث عنه؟",
            "subtext": "استخدم البحث أو التصفح حسب الفئة للعثور بسرعة على الموارد التي تحتاجها.",
            "placeholder": "ابحث في المصادر...",
            "browse_btn_text": "تصفح جميع المصادر"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "الفعاليات",
            "title": "الفعاليات والمؤتمرات",
            "lead": "ابقَ على اطلاع دائم بمؤتمرات PMA، ومبادرات الوساطة، وورش العمل، والإعلانات الهامة.",
            "image_alt": "صورة هيرو للخدمات"
          },
          "tab_bar": {
            "upcoming_events": "الفعاليات القادمة",
            "past_events": "الفعاليات السابقة",
            "announcements": "الإعلانات"
          },
          "upcoming_panel": {
            "title": "قريباً جداً",
            "lead": "سيتم إدراج الفعاليات والمؤتمرات وورش العمل القادمة هنا. يرجى المراجعة قريباً."
          },
          "announcements_panel": {
            "title": "قريباً جداً",
            "lead": "ستظهر الإعلانات الهامة هنا. ابقوا معنا للاطلاع على الجديد."
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "فعالية سابقة",
                "pill_text": "برنامج تدريبي معتمد",
                "view_gallery_btn": "عرض معرض صور الفعالية",
                "about_label": "حول الفعالية",
                "highlights_label": "أبرز نقاط التدريب"
              },
              "card": {
                "title": "البرنامج التدريبي السادس المعتمد للوساطة",
                "sub": "محكمة السند العليا",
                "date": "من 08 يونيو 2026 إلى 12 يونيو 2026",
                "location": "محكمة السند العليا، كراتشي"
              },
              "about_paragraphs": [
                "نجحت جمعية الموفقين الباكستانية (PMA) في تنظيم البرنامج التدريبي السادس المعتمد للوساطة في محكمة السند العليا.",
                "ركز البرنامج على تعزيز مهارات الوساطة، وتشجيع ممارسات الحلول البديلة لفض النزاعات، وتعزيز القدرات المهنية بين الممارسين القانونيين ومحترفي الوساطة.",
                "من خلال الجلسات التفاعلية والتمارين العملية والمناقشات التعاونية، اكتسب المشاركون رؤى قيمة حول تقنيات الوساطة الحديثة وأطر حل النزاعات."
              ],
              "highlights": [
                "جلسات تدريب معتمدة على الوساطة",
                "تمارين عملية على الوساطة",
                "مناقشات مجموعات تفاعلية",
                "تقنيات الحلول البديلة لفض النزاعات",
                "بناء القدرات المهنية",
                "بيئة تعليمية تعاونية"
              ],
              "meta": {
                "objective_label": "الهدف من التدريب",
                "objective_text": "تعزيز مهارات الوساطة وتشجيع ممارسات الفعالة لحل النزاعات.",
                "organized_label": "الجهة المنظمة",
                "organized_text": "جمعية الموفقين الباكستانية (PMA)",
                "participants_label": "المشاركون",
                "participants_text": "المتخصصون القانونيون، ممارسو الحلول البديلة لفض النزاعات، الوسيطون والمشاركون المتدربون.",
                "type_label": "نوع الفعالية",
                "type_text": "برنامج تدريبي معتمد"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "فعالية سابقة",
                "about_label": "حول الفعالية",
                "highlights_label": "تطورات رئيسية تم تسليط الضوء عليها في الـ ADR"
              },
              "card": {
                "title": "الوساطة: الطريق إلى الأمام",
                "sub": "المؤتمر الوطني الأول للوساطة",
                "date": "7 مارس 2015",
                "location": "فندق ماريوت، كراتشي",
                "type": "مؤتمر وطني"
              },
              "about_paragraphs": [
                "تعتبر PMA أول منظمة في باكستان تمثل الموفقين المدربين والمعتمدين دولياً بالإضافة إلى المهنيين الآخرين الذين انضموا للجمعية لتعزيز أهدافها. تأسست الجمعية في عام 2013 وتولت عدداً من الأنشطة التي كانت تُنفذ سابقاً من قبل مشروع الحلول البديلة لفض النزاعات (ADR) التابع لمؤسسة التمويل الدولية/مجموعة البنك الدولي.",
                "بالنظر إلى أن مؤشرات إنفاذ العقود في باكستان ليست مشجعة وتستغرق سنوات عديدة وتكاليف باهظة، فإن PMA عازمة على قيادة ودعم التدخلات التي تمكن المتقاضين والمتنازعين من تسوية النزاعات ودياً ومن خلال عملية الوساطة، وتكملة جهود القضاء والمحاكم في حل النزاعات في الوقت المناسب."
              ],
              "highlights": [
                "تفعيل مركز كراتشي لفض النزاعات في كراتشي ومركز وساطة غرفة تجارة وصناعة لاهور في لاهور.",
                "المطالبة بإصلاحات قوانين الوساطة والحلول البديلة لفض النزاعات في باكستان.",
                "وجود وسطاء ومدربين معتمدين من CEDR في باكستان.",
                "تطوير مناهج الحلول البديلة لفض النزاعات (ADR) في باكستان.",
                "تعزيز وتقديم التدريبات الخاصة بالحلول البديلة لفض النزاعات في باكستان.",
                "اعتبار الـ ADR وسيلة لتسوية مجموعة واسعة من النزاعات بما في ذلك حوكمة الشركات."
              ],
              "meta": {
                "objective_label": "أهداف المؤتمر",
                "objective_text": "تعزيز قضية الحلول البديلة لفض النزاعات والوساطة ومناقشة التطورات والتحديات والتدخلات المستقبلية لمأسسة الوساطة في باكستان.",
                "organized_label": "مستضيفو المؤتمر",
                "organized_text": "تستضيف هذا المؤتمر جمعية الموفقين الباكستانية بدعم من شركاء المؤتمر.",
                "participants_label": "المتحدثون والضيوف",
                "participants_text": "ممثلون عن الحكومة والقضاء ومجتمع الأعمال والملتقى القانوني والأكاديميين ومراكز الوساطة في باكستان إلى جانب متحدثين أجانب.",
                "type_label": "نوع الفعالية",
                "type_text": "مؤتمر وطني"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "سياسة",
            "title_accent": "الخصوصية",
            "lead_text": "نحن ملتزمون بحماية خصوصيتك وضمان التعامل مع معلوماتك الشخصية بشكل آمن ومسؤول."
          },
          "sections": {
            "commitment": {
              "title": "الالتزام بالخصوصية",
              "paragraphs": [
                "تلتزم جمعية الموفقين الباكستانية (PMA) بحماية خصوصيتك على الإنترنت. وقد أنشأت جمعية الموفقين الباكستانية (PMA) بيان الخصوصية هذا لإثبات التزامنا الراسخ بالخصوصية. يوضح ما يلي ممارسات جمع المعلومات ونشرها لجمعية الموفقين الباكستانية (PMA).",
                "تحتفظ PMA بالحق في تغيير هذه السياسة في أي وقت عن طريق إخطار المستخدمين بوجود بيان خصوصية جديد. إن هذا البيان والسياسات الموضحة فيه لا يُقصد منها ولا تنشئ أي حقوق تعاقدية أو حقوق قانونية أخرى في أو نيابة عن أي طرف."
              ]
            },
            "respect_data": {
              "title": "احترام بيانات المستخدم",
              "paragraphs": [
                "تقدر جمعية الموفقين الباكستانية (PMA) عالياً العلاقات القوية التي تربطنا بعملائنا. ويتم التعامل مع جمع البيانات في جمعية الموفقين الباكستانية (PMA) باحترام كامل وسليم لخصوصية عملائنا.",
                "يتم التعامل مع البيانات التي نجمعها بحساسية وأمان ومع المراعاة التامة للخصوصية. لا تقوم جمعية الموفقين الباكستانية (PMA) بالإفصاح عن البيانات التي نجمعها من عملائنا أو توزيعها أو بيعها لأطراف ثالثة."
              ]
            },
            "collection": {
              "title": "جمع المعلومات",
              "lead_text": "تقوم PMA بجمع معلومات للتسجيل في العضوية مثل:",
              "items": [
                "بطاقة الهوية الوطنية المحوسبة (CNIC)",
                "الاسم الكامل",
                "عنوان السكن",
                "عنوان المكتب",
                "رقم الهاتف",
                "معلومات البريد الإلكتروني",
                "معلومات العضوية الأخرى ذات الصلة"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "سياسة الشكاوى",
            "title_accent": "والاستئناف",
            "lead_text": "نحن ملتزمون بمعالجة المخاوف والشكاوى بشكل عادل وفوري وشفاف."
          },
          "intro_card": {
            "bold_text": "لدينا إجراءات واضحة للتعامل مع الشكاوى تضمن منحها الرعاية والاهتمام اللازمين.",
            "lead_p": "يمكن تقديم الشكاوى من قبل أي مستخدم لخدمات اعتماد الوساطة الخاصة بـ PMA. تهدف الجمعية إلى تقديم خدمة سريعة وموقوتة لجميع المستخدمين. نحن سوف:",
            "commitments": [
              "نتعامل مع جميع الشكاوى بجدية ونعالجها بشكل صحيح؛",
              "ننظر في الشكاوى ونحلها على الفور؛ و",
              "نتعلم من الشكاوى ونتخذ الإجراءات اللازمة لتحسين خدماتنا."
            ]
          },
          "steps": [
            {
              "text": "ومع ذلك، لا يمكننا التعامل إلا مع الشكاوى التي تثير مخاوف بشأن سوء خدمة العملاء التي يتم تلقيها من قبل مدير التدريب."
            },
            {
              "text": "هذا يعني أنه يجب توجيه حالتك إلى مدير التدريب وإرسالها بالبريد العادي والبريد الإلكتروني مع إرسال نسخة (cc) إلى رئيس PMA."
            },
            {
              "text": "الطالب الذي لا يرضى عن قرار مدير التدريب حر في رفض القرار، وفي هذه الحالة لن يكون له أي أثر ملزم. يلتزم المدير بالرد على الشكوى خلال 30 يوماً من تاريخ استلامها."
            },
            {
              "text": "إذا ظللت، مع ذلك، غير راضٍ عن طريقة التعامل مع شكواك أو لم يكن هناك رد من مدير التدريب، يمكنك توجيه شكواك إلى رئيس PMA الذي سيقوم بتشكيل لجنة تحكيم أعضاء هيئة التدريس مكونة من عضوين لسماع تظلمك."
            },
            {
              "text": "ستحتاج إلى أن تكون واضحاً وموجزاً بشأن أسباب طلبك وما تود تحقيقه من المراجعة أو عدم اتخاذ إجراء من قبل مدير التدريب. ستقوم لجنة التحكيم المكونة من عضوين بالكتابة إليك مع إرسال نسخة إلى رئيس PMA والرد عليك خطياً بالتأكيد في غضون 30 يوم عمل من تقديم طلب التصعيد."
            },
            {
              "text": "إذا كنت غير راضٍ عن الإجراء أو عدم اتخاذ إجراء من جانب لجنة التحكيم المكونة من عضوين بشأن شكواك، فإن ذلك لن يؤثر على حقوق أي طرف في اللجوء إلى محكمة حماية المستهلك للحصول على الإغاثة، وهي الخيارات المتاحة للجميع."
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "الشروط و",
            "title_accent": "الأحكام",
            "lead_text": "يرجى قراءة هذه الشروط بعناية. بدخولك واستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بالشروط والأحكام التالية."
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "التدريب",
              "preview": "لتأكيد حجزك، يجب أن تصل دفعتك إلى مكاتبنا مسبقاً؛ قبل بدء الدورات التدريبية.",
              "body_paragraphs": [
                "إذا تأخر المستخدم في السداد، فلن يُسمح له بحضور الدورات التدريبية."
              ]
            },
            {
              "id": "refunds",
              "title": "استرداد رسوم التدريب",
              "preview": "نحن نتفهم أن الحياة قد تكون معقدة. إذا لم تعد قادراً على الحضور، يرجى الاتصال بنا في أقرب وقت ممكن على 9768-3452-021 أو مراسلتنا عبر البريد الإلكتروني على info@pma.org.pk.",
              "body_paragraphs": [
                "يسعدنا قبول حضور مشارك بديل مكانك، أو الترتيب لرصيد مستقبلي أو استرداد أموال، وسوف ننظر دائماً في حالتك بناءً على أساس فردي."
              ]
            },
            {
              "id": "membership",
              "title": "إلغاء العضوية",
              "preview": "رسوم العضوية غير قابلة للاسترداد إلا في ظروف خاصة.",
              "body_paragraphs": [
                "يرجى الاتصال بنا إذا كنت تعتقد أن ظروفك تؤهلك لاستثناء. تتم مراجعة كل حالة على حدة من قبل لجنة العضوية في PMA."
              ]
            },
            {
              "id": "copyright",
              "title": "حقوق الطبع والنشر",
              "preview": "يخضع هذا الموقع ومحتوياته لحقوق الطبع والنشر. تعود ملكية حقوق طبع ونشر مواد الموقع لجمعية الموفقين الباكستانية (PMA)، أو لطرف ثالث في حالة بعض المواد. تعود ملكية حقوق طبع ونشر وظائف الموقع وتشغيله لـ PMA.",
              "body_paragraphs": [
                "يجوز لك عرض هذا الموقع ومحتوياته باستخدام متصفح الويب الخاص بك ونسخ وطباعة نسخ ورقية من أجزاء من هذا الموقع إلكترونياً فقط للاستخدام الشخصي غير التجاري. ويحظر تماماً أي استخدام آخر، بما في ذلك إعادة إنتاج محتوى هذا الموقع أو تعديله أو توزيعه أو نقله أو إعادة نشره أو عرضه أو أداؤه."
              ]
            },
            {
              "id": "disclaimer",
              "title": "إخلاء المسؤولية",
              "preview": "أنت توافق على أن دخولك إلى هذا الموقع واستخدامه يخضع لهذه الشروط وجميع القوانين المعمول بها، ويكون على مسؤوليتك الخاصة. يتم تقديم هذا الموقع ومحتوياته إليك على أساس \"كما هو\"، وقد يحتوي الموقع على أخطاء وعيوب وعدم دقة وقد لا يكون كاملاً وحديثاً.",
              "body_paragraphs": [
                "لا تقدم جمعية الموفقين الباكستانية (PMA) أي تمثيلات أو ضمانات من أي نوع، صريحة أو ضمنية بشأن تشغيل هذا الموقع أو المعلومات أو المحتوى أو المواد أو المنتجات المدرجة في هذا الموقع، باستثناء ما هو منصوص عليه خلاف ذلك بموجب القوانين المعمول بها.",
                "لن تكون PMA ولا الشركات التابعة لها أو مديروها أو مسؤولوها أو موظفوها أو وكلاؤها أو مقاولوها أو خلفاؤها أو المحال إليهم مسؤوليين عن أي أضرار تنشأ عن أو تتعلق بأي شكل من الأشكال باستخدام هذا الموقع وأي موقع آخر مرتبط به. ينطبق هذا القيد على الأضرار المباشرة أو غير المباشرة أو التبعية أو الخاصة أو العقابية أو غيرها من الأضرار التي قد تلحق بك أو بالآخرين، بالإضافة إلى الأضرار الناجمة عن خسارة الأرباح أو انقطاع الأعمال أو فقدان البيانات أو المعلومات."
              ]
            },
            {
              "id": "translations",
              "title": "ترجمات جوجل",
              "preview": "تمت ترجمة هذا الموقع لراحتك باستخدام عملية ترجمة مدعومة من Google Translate™. يتم إجراء ترجمات Google Translate™ بواسطة عملية كمبيوتر آلية، وليس بواسطة مترجم محترف معتمد.",
              "body_paragraphs": [
                "ولهذا السبب، قد تكون الترجمات غير دقيقة أو غير موثوقة. استخدم ترجمات Google Translate™ بحذر. يتم توفير الترجمات \"كما هي\" دون ضمانات من أي نوع. قد لا يتم ترجمة بعض المحتويات (مثل الصور ومقاطع الفيديو والفلاش وما إلى ذلك) بسبب قيود برنامج الترجمة.",
                "إن PMA ليست مسؤولة عن الترجمات غير الكاملة أو غير الدقيقة، كما أنها ليست مسؤولة عن أي أضرار أو خسائر تنشأ عن استخدام المستخدم لترجمات Google Translate™ (أو أي ترجمات أخرى على هذا الموقع).",
                "إذا كان لديك أي أسئلة حول Google™ Translate، تفضل بزيارة: الأسئلة الشائعة حول Google Translate™.",
                "تخلي Google مسؤوليتها عن جميع الضمانات المتعلقة بالترجمات، الصريحة أو الضمنية، بما في ذلك أي ضمانات للدقة والموثوقية، وأي ضمانات ضمنية للرواج والصلاحية لغرض معين وعدم الانتهاك."
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "انضم إلى PMA",
            "title_main": "كن",
            "title_accent": "عضواً في PMA",
            "lead_text": "انضم إلى مجتمع متميز من الوسطاء، ومحترفي تسوية المنازعات بالطرق البديلة (ADR)، والقادة المؤسسيين الملتزمين بالحل السلمي للنزاعات."
          },
          "why_join": {
            "title_main": "لماذا",
            "title_accent": "تنضم",
            "title_end": "إلى PMA؟",
            "subtitle": "يتمتع أعضاء PMA بمجموعة واضحة من المزايا والفرص المهنية.",
            "cards": [
              {
                "title": "المؤتمرات الدولية",
                "description": "حضور المؤتمرات العالمية حول أحدث القضايا في الوساطة والتحكيم برسوم مخفضة وتسجيل ذي أولوية."
              },
              {
                "title": "ورش العمل والدورات",
                "description": "الحصول على فرصة الوصول إلى ورش عمل تعليمية ودورات تطوير مهني عالية الجودة."
              },
              {
                "title": "النمو المهني",
                "description": "زيادة فهمك للوساطة والحلول البديلة لفض المنازعات (ADR) من خلال رؤى وموارد الخبراء."
              },
              {
                "title": "شبكة عالمية",
                "description": "بناء وتطوير علاقات مهنية قيمة على المستويين الوطني والدولي."
              },
              {
                "title": "فرص تجارية",
                "description": "توسيع دائرة معارفك التجارية والمهنية."
              },
              {
                "title": "دعم المهنة",
                "description": "لعب دور رئيسي في دعم وتطوير الوساطة والحلول السلمية للنزاعات."
              }
            ]
          },
          "benefits": {
            "title_main": "مزايا",
            "title_accent": "العضوية",
            "subtitle": "بصفتك عضواً مسجلاً في PMA، سوف تستمتع بمجموعة واسعة من المزايا والفرص.",
            "items": [
              {
                "title": "فرص التواصل وبناء العلاقات",
                "description": "على مدار العام، توفر PMA فرصاً متنوعة للأعضاء لتعزيز العلاقات المهنية ومواكبة أنشطة واتجاهات القطاع."
              },
              {
                "title": "دليل العضوية",
                "description": "متاح حصرياً لأعضاء PMA، ويحتوي هذا الدليل على تفاصيل اتصال محدثة للأعضاء والمنظمات العالمية الأخرى. متوفر بنسختين مطبوعة وإلكترونية."
              },
              {
                "title": "شهادة العضوية",
                "description": "يتم منح الأعضاء شهادة عضوية معترف بها عالمياً فور قبولهم. وتُوزع الشهادات في الحفل السنوي للأعضاء."
              },
              {
                "title": "التطوير المهني المستمر",
                "description": "أولوية الوصول إلى ورش عمل حصرية ودورات تطوير مهني يقدمها خبراء بارزون في الوساطة والحلول البديلة لفض المنازعات (ADR)، باللغتين الإنجليزية والعربية."
              }
            ]
          },
          "membership_journey": {
            "title": "رحلة العضوية",
            "subtitle": "عملية بسيطة لتصبح عضواً قيماً في جمعية الموفقين الباكستانية (PMA).",
            "steps": [
              {
                "num": "1",
                "title": "تقديم نموذج العضوية",
                "desc": "املأ نموذج الطلب عبر الإنترنت."
              },
              {
                "num": "2",
                "title": "مراجعة الملف الشخصي",
                "desc": "سيقوم فريقنا بمراجعة طلبك."
              },
              {
                "num": "3",
                "title": "الموافقة على العضوية",
                "desc": "سيتم إخطارك بمجرد الموافقة على طلبك."
              },
              {
                "num": "4",
                "title": "مرحباً بك في PMA",
                "desc": "احصل على شهادة العضوية الخاصة بك وتصبح جزءاً من شبكتنا المهنية."
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "نموذج طلب العضوية",
              "desc": "يرجى تقديم معلومات دقيقة. جميع الحقول المادية التي تحمل علامة * إلزامية."
            },
            "sections": {
              "personal_info": {
                "title": "معلومات شخصية",
                "fields": {
                  "full_name": { "label": "الاسم الكامل", "placeholder": "أدخل اسمك الكامل" },
                  "father_name": { "label": "اسم الأب", "placeholder": "أدخل اسم الأب" },
                  "qualification": { "label": "المؤهل التعليمي", "placeholder": "أدخل المؤهل" },
                  "designation": { "label": "المسمى الوظيفي", "placeholder": "أدخل المسمى الوظيفي" },
                  "cnic": { "label": "رقم الهوية الوطنية (CNIC)", "placeholder": "أدخل رقم الهوية" },
                  "chamber_phone": { "label": "هاتف المكتب/الغرفة", "placeholder": "أدخل هاتف المكتب" }
                }
              },
              "contact_info": {
                "title": "معلومات الاتصال",
                "fields": {
                  "office_address": { "label": "عنوان المكتب", "placeholder": "أدخل عنوان المكتب" },
                  "res_address": { "label": "عنوان السكن", "placeholder": "أدخل عنوان السكن" },
                  "res_phone": { "label": "هاتف المنزل", "placeholder": "أدخل هاتف المنزل" },
                  "email": { "label": "البريد الإلكتروني", "placeholder": "أدخل البريد الإلكتروني" },
                  "upload": {
                    "label": "تحميل المستندات",
                    "text": "اختر ملفاً أو اسحبه هنا",
                    "hint": "PDF, JPG, PNG (الحد الأقصى 5 ميجابايت)"
                  }
                }
              },
              "references": {
                "title": "المراجع المهنية",
                "fields": {
                  "proposer_name": { "label": "الاسم الكامل للمقترح (المزكي الأول)", "placeholder": "أدخل الاسم الكامل للمقترح" },
                  "proposer_address": { "label": "العنوان السكني للمقترح", "placeholder": "أدخل العنوان" },
                  "proposer_phone": { "label": "هاتف المقترح", "placeholder": "أدخل رقم الهاتف" },
                  "seconder_name": { "label": "الاسم الكامل للمؤيد (المزكي الثاني)", "placeholder": "أدخل الاسم الكامل للمؤيد" },
                  "seconder_address": { "label": "العنوان السكني للمؤيد", "placeholder": "أدخل العنوان" },
                  "seconder_phone": { "label": "هاتف المؤيد", "placeholder": "أدخل رقم الهاتف" }
                }
              }
            },
            "declaration": "أقر بموجب هذا بأن المعلومات المقدمة أعلاه صحيحة ودقيقة.",
            "submit_btn": "تقديم الطلب",
            "sidebar": {
              "title_main": "كن جزءاً من",
              "title_accent": "التغيير الإيجابي",
              "desc": "انضم إلى PMA وساهم في بناء ثقافة الحوار والتفاهم والحل السلمي للنزاعات.",
              "list": [
                "الاعتراف المهني",
                "التعلم والتطوير",
                "التواصل والتعاون",
                "المساهمة المؤثرة"
              ],
              "quote": "معاً، يمكننا خلق مجتمع أكثر انسجاماً وعدلاً من خلال الوساطة.",
              "author": "- PMA"
            }
          }
        }
      }
    },
    ch: {
      translation: {
        nav: {
          home: "首页",
          about: "关于PMA",
          mediation: "调解",
          services: "服务",
          training: "培训",
          leadership: "领导力",
          resources: "资源",
          events: "活动",
          contact: "联系我们",
          membership: "成为会员"
        },
        hero: {
          title_part1: "促进和平解决",
          title_part2: "通过对话、理解和尊重",
          description1: "我们推崇调解作为对传统诉讼的有效、高效、保密和协作的替代方案。",
          description2: "通过结构化的对话和专业的便利化，我们帮助个人、家庭、企业和机构友好地解决冲突——同时保护关系并减少时间、成本和压力。",
          btn_consult: "申请免费咨询",
          btn_training: "探索培训项目"
        },
        features: {
          confidential_title: "保密且私密",
          confidential_desc: "您的讨论保持完全安全和保护。",
          faster_title: "更快的解决方案",
          faster_desc: "在几天或几周而不是几个月内解决争议。",
          cost_title: "具有成本效益的解决方案",
          cost_desc: "避免昂贵的法律费用和冗长的法律诉讼。"
        },
        glance: {
          title: "PMA一览",
          founded: "成立于2013-14年",
          founded_label: "巴基斯坦首家调解协会",
          mediations: "2000+",
          mediations_label: "成功的调解和便利化案件",
          mediators: "100+",
          mediators_label: "遍布巴基斯坦的认证调解员",
          training: "100+",
          training_label: "已提供的培训项目",
          impact: "国家影响",
          impact_label: "推进替代纠纷解决意识和政策改革"
        },
        about: {
          years: "年份",
          stat_label: "促进调解卓越",
          tab1_title: "关于PMA",
          tab1_text: "PMA（巴基斯坦调解员协会）是一个独立机构，致力于在巴基斯坦推广通过调解和替代纠纷解决（ADR）的和平纠纷解决。",
          tab2_title: "我们的愿景",
          tab2_text: "在巴基斯坦建立调解作为纠纷解决的主要和最可信任的方法，促进建设性对话、相互理解和和平共处的文化。",
          tab3_title: "我们的使命",
          tab3_mission1: "推崇调解作为一种易获取和有效的纠纷解决机制",
          tab3_mission2: "根据国际标准培训和认证调解员",
          tab3_mission3: "与法院、政府机构和私营部门合作",
          tab3_mission4: "提高社会对调解益处的认识",
          tab4_title: "我们的影响",
          tab4_text1: "PMA已成功培训了数百名律师、法官和专业人士，并在推动巴基斯坦与法院挂钩的调解举措中发挥了关键作用。",
          tab4_text2: "我们继续与司法部门和利益相关者密切合作，以加强调解作为一个可持续的纠纷解决系统。",
          info_phone_label: "需要我们的服务吗？",
          info_phone_val: "致电：+92 300 000 0000",
          info_hours_label: "营业时间",
          info_hours_val: "星期一至星期五（上午9点至下午5点）",
          info_email_label: "给我们发邮件",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "什么是调解？",
          text1: "调解是一种自愿、保密且结构化的过程，由中立的调解员帮助冲突双方进行沟通，理解彼此的观点，并达成双方都能接受的解决方案。",
          text2: "它赋予当事人掌控结果的能力，维护了关系，并节省了时间、成本和情感压力。",
          btn: "了解调解流程"
        },
        why_choose: {
          title: "为什么选择 <span class='pma-about-heading-accent'>PMA？</span>",
          lead: "我们将国际化标准与本地化认知相结合，提供恪守职业道德、高效且可持续的多样化纠纷解决机制（ADR）方案。",
          btn: "深入了解 PMA",
          features: {
            f1_title: "国际化标准",
            f1_desc: "我们严格遵循全球公认的调解原则与行业惯例。",
            f2_title: "经验丰富且资质认证的调解员",
            f2_desc: "我们的专家团队由经过严格培训且获得权威认证的专业人士组成。",
            f3_title: "高度保密的流程",
            f3_desc: "在调解的每一个阶段，您的隐私始终是我们的重中之重。",
            f4_title: "更高效与友好双赢的结果",
            f4_desc: "我们协助各方快速、圆满地化解矛盾争议。",
            f5_title: "更具成本效益",
            f5_desc: "相比昂贵且冗长的法庭诉讼，这是一种更务实且高效的替代方案。"
          }
        },
        training: {
          title_part1: "专业培训与",
          title_part2: "资质认证",
          text: "PMA 提供与国际接轨的调解 training 与专业发展项目，专为律师、企业高管、HR 团队、教育工作者以及有志于成为调解员的人士设计。我们的工作坊和认证课程专注于实际的纠纷解决技巧、谈判策略、沟通技巧以及多样化纠纷解决机制（ADR）框架。",
          features: {
            feat1: "IMI 国际认证",
            feat2: "专家级培训师",
            feat3: "实战化学习",
            feat4: "全球化标准"
          },
          card_text: "我们的培训项目符合国际标准，赋予专业人士成为高效、恪守职业道德且具备全球竞争力的调解员的能力。",
          btn_text: "探索培训项目"
        },
        services: {
          title: "我们的核心服务",
          list: {
            s1: { title: "商业与企业调解", desc: "高效解决业务、合伙及合同争议。" },
            s2: { title: "法院引荐调解", desc: "为法院相关事项提供 ADR 支持。" },
            s3: { title: "家庭与社区调解", desc: "帮助家庭和社区和平解决冲突。" },
            s4: { title: "职场与组织纠纷", desc: "处理职场内部冲突和组织不和。" },
            s5: { title: "IMI 认证调解员培训", desc: "专业调解员认证与技能发展项目。" },
            s6: { title: "研讨会与宣传项目", desc: "推广 ADR 意识与冲突解决文化的教育课程。" },
            s7: { title: "制度与政策咨询", desc: "支持机构构建 ADR 系统与调解框架。" }
          }
        },
        leadership: {
          title: "认识我们的领导团队",
          roles: { president: "主席", secretary: "秘书长", vp_north: "副主席（北方）", ec_north: "执行委员会 - 北部" }
        },
        stats: {
          s1: { label: "已协调调解", unit: "+" },
          s2: { label: "成功解决率", unit: "%" },
          s3: { label: "100% 私密流程", value: "保密" },
          s4: { label: "受训调解员", value: "已认证" }
        },
        partners: {
          title: "我们的合作伙伴",
          p1: "信德省高等法院",
          p2: "政府机构",
          p3: "国际调解协会"
        },
        cta: {
          title: "让我们谈谈，因为我们可以。",
          subtitle: "准备好和平解决争端了吗？或者有兴趣成为认证调解员？今天就联系我们",
          btn1: "申请免费咨询",
          btn2: "成为认证调解员",
          link: "与我们的团队即时聊天"
        },
        footer: {
          brand: {
            tagline: "在巴基斯坦全境通过对话、调解和相互理解促进和平解决方案。",
            logo_alt: "巴基斯坦调解员协会"
          },
          quick_links: {
            title: "快速链接",
            items: [
              { label: "首页", link: "index.html" },
              { label: "关于 PMA", link: "about.html" },
              { label: "调解", link: "mediation.html" },
              { label: "服务", link: "services.html" },
              { label: "培训", link: "training.html" },
              { label: "领导团队", link: "leadership.html" },
              { label: "资源", link: "resources.html" },
              { label: "活动", link: "events.html" },
              { label: "联系我们", link: "contact.html" }
            ]
          },
          services: {
            title: "我们的服务",
            items: [
              "调解服务",
              "IMI 认证调解员培训",
              "ADR 研讨会及宣传课程",
              "机构 ADR 咨询",
              "政策与调解倡导"
            ]
          },
          contact: {
            title: "联系信息",
            hours: "周一至周五（上午 9 点至下午 5 点）",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 巴基斯坦调解员协会 (PMA)。版权所有。",
            legal: [
              { label: "常见问题 (FAQ's)", link: "faq.html" },
              { label: "隐私政策", link: "privacy-policy.html" },
              { label: "投诉与申诉政策", link: "complaint-policy.html" },
              { label: "条款与条件", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "关于 PMA",
            eyebrow: "关于 PMA",
            title_part1: "构建一种专注于",
            title_part2: "对话、争端解决与相互理解的文化",
            lead: "巴基斯坦调解员协会 (PMA) 致力于通过专业培训、机构合作和国际认可的执业标准，在巴基斯坦全境推动调解和替代性争议解决 (ADR) 的发展。"
          },
          about: {
            hero_img_alt: "关于 PMA",
            hero_eyebrow: "关于 PMA",
            hero_title_part1: "构建一种专注于",
            hero_title_part2: "对话、争端解决与相互理解的文化",
            hero_lead: "巴基斯坦调解员协会 (PMA) 致力于通过专业培训、机构合作和国际认可的执业标准，在巴基斯坦全境推动调解和替代性争议解决 (ADR) 的发展。",
            badge_years: "周年",
            badge_stat_label: "推行卓越的 <br>调解服务",
            nav_tab1: "关于 PMA",
            nav_tab2: "我们的愿景",
            nav_tab3: "我们的使命",
            nav_tab4: "我们的影响",
            tab1_title1: "关于",
            tab1_title2: "PMA",
            tab1_text: "PMA 成立于 2013 年，并在巴基斯坦政府注册，是经英国有效争议解决中心 (CEDR) 授权在巴基斯坦开展 CEDR 模式调解培训的专业机构。<br><br>PMA 已于 2018 年与泰国仲裁中心签署了谅解备忘录，并与南亚区域合作联盟 (SAARC) 其他国家的机构保持着紧密的合作关系。<br><br>我们的协会由国际公认、经 CEDR 培训的主讲培训师和调解员组成。他们已成功为信德省、旁遮普省和伊斯兰堡 Jurisdictions 的法官和律师开展了多项培训计划，从而提高了该国调解的专业标准。",
            tab2_title1: "我们的",
            tab2_title2: "愿景",
            tab2_text: "将调解确立为巴基斯坦领先且最值得信赖的争议解决方式，促进建设性对话、相互理解和和平共处的文化。",
            tab3_title1: "我们的",
            tab3_title2: "使命",
            tab3_points: [
              "推动调解成为一种可及且有效的争议解决机制",
              "按照国际标准培训和认证调解员",
              "与法院、政府机构和私营部门开展紧密合作",
              "提高全社会对调解益处的认识"
            ],
            tab4_title1: "我们的",
            tab4_title2: "影响",
            tab4_text1: "PMA 已成功培训了数百名律师、法官和专业人士，并在推动巴基斯坦法院衔接调解工作方面发挥了关键作用。",
            tab4_text2: "我们继续与司法界及各利益相关方密切合作，以巩固调解作为可持续争议解决体系的地位。"
          },
          leadership: {
            title1: "领导团队",
            title2: "致辞",
            president: {
              name: "Aga Zafar Ahmad",
              role1: "巴基斯坦最高法院律师",
              role2: "主席",
              role3: "巴基斯坦调解员协会",
              heading: "主席致辞",
              quote: "调解不仅是一种专业工具，更是发展中法律体系 tank 必需品。",
              lead: "随着法律和商业环境的演变，替代性争议解决 (ADR) 在确保快速、公平和有效正义方面的作用从未像现在这样至关重要。作为主席，我的工作重点是扩大我们的影响力，确保调解成为我们法律体系的基石。",
              read_more: "阅读完整致辞",
              sign_role: "巴基斯坦最高法院律师<br>巴基斯坦调解员协会主席",
              popup: {
                p1: "有幸担任巴基斯坦调解员协会 (PMA) 主席，我深感荣幸。随着法律和商业环境的演变，替代性争议解决 (ADR) 在确保快速、公平和有效正义方面的作用从未像现在这样至关重要。",
                p2: "作为本协会的创始成员，我的历程源于一种信念：调解不仅是一种专业工具，更是发展中法律体系的必需品。展望未来，我的承诺是确保我们的协会成为一个更具活力和协作性的平台，架起传统诉讼与现代争议解决方式之间的桥梁。",
                p3: "自成立以来，PMA 一直致力于在巴基斯坦全境推广和规范调解实践。我们努力保持最高标准的专业操守，并为全国的调解员提供统一发声的平台。作为主席，我的工作重点是扩大我们的影响力，确保调解成为我们法律体系的基石，并被司法界和公众公认为促进社会与经济和谐的重要工具。",
                commit_heading: "我们致力于：",
                commit_list: [
                  "<strong>能力建设与专业发展：</strong> 继续为调解员提供高水平的培训和认证，以确保达到世界级的执业标准，使我们成员的技能始终处于行业前沿。",
                  "<strong>行业倡导：</strong> 与利益相关方和司法界紧密沟通，将调解引入并融入主流法律框架。",
                  "<strong>坚持创新：</strong> 采用现代技术和全球最佳实践，有效解决贸易、海事和商业冲突。",
                  "<strong>全国大会：</strong> 我们将努力组织定期集会，分享行业见解、庆祝成功，并加强我们在全国的共同发声。",
                  "<strong>加强协调：</strong> 我们致力于改善所有成员之间的沟通与参与，确保每种观点都能被倾听和重视。",
                  "<strong>扩大成员规模：</strong> 我们将积极欢迎新专业人士的加入，以扩大调解在巴基斯坦法律界和商界的影响力。",
                  "<strong>调解员行为准则：</strong> 此外，本届任期的一个核心重点是成立一个新委员会，专门负责与巴基斯坦律师理事会和各省律师理事会进行协调。该举措将专注于正式确立一套完善的《调解员行为准则》，确保我们的执业始终基于最高的道德和专业标准。"
                ],
                closing: "我邀请大家加入我们的使命，共同推进调解主流化，在巴基斯坦培育和谐与追求卓越专业的文化。"
              }
            },
            founding_president: {
              name: "Anwar Kashif Mumtaz",
              role1: "巴基斯坦最高法院律师",
              role2: "认证调解员",
              heading: "创始主席致辞",
              quote: "齐心协力，我们可以构建一种理解重于对抗的文化。",
              lead: "我们的使命是在我们挚爱的国家内推广调解，使其成为一种有效、合乎道德且易于获取的争议解决手段。",
              read_more: "阅读完整致辞",
              sign_role: "最高法院律师<br>认证调解员",
              popup: {
                p1: "今天，作为巴基斯坦调解员协会的创始主席，很高兴见证这一致力于对话和和平解决争议平台的成长。我们的使命是在我们挚爱的国家内推广调解，使其成为一种有效、合乎道德且易于获取的争议解决手段。我们依然致力于维护最高的专业标准，并增进对替代性争议解决机制的信任。",
                p2: "通过合作、培训和持续学习，我们旨在加强全国调解员的能力建设。",
                p3: "我鼓励所有利益相关方拥抱调解，将其作为补充司法体系、走向正义与和谐的建设性路径。",
                closing: "齐心协力，我们可以构建一种理解重于对抗的文化。"
              }
            },
            stats: {
              s1_title: "数百人受训",
              s1_text: "在巴基斯坦全境培训了数以百计的律师、法官和专业人士。",
              s2_title: "法院衔接调解",
              s2_text: "在全国范围内推广并强化法院衔接调解的各项举措。",
              s3_title: "紧密合作",
              s3_text: "与司法界和利益相关方密切合作，打造可持续的争议解决体系。"
            }
          },
          partners: {
            title: "我们的合作伙伴",
            p1: "信德省高等法院",
            p2: "政府机构",
            p3: "国际调解协会"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "调解咨询室",
            eyebrow: "调解服务 (Mediation)",
            title_part1: "化解矛盾争议 坚守",
            title_part2: "对话与相互理解",
            lead: "调解是一个自愿、保密且结构化的过程。在此过程中，中立的调解员将协助各方达成相互接受且可持续的解决方案。"
          },
          mediation: {
            title1: "什么是",
            title2: "调解？",
            text1: "调解是一个自愿、保密且结构化的过程。在此过程中，中立且公正的第三方——即调解员 (Mediator)——促进纠纷各方之间的对话，以帮助他们达成相互接受且可持续的解决方案。",
            text2: "与法庭訴訟不同，调解强调合作、自主决定和创造性地解决问题。它使各方能够在保持彼此关系的同时，获得更高效、更具成本效益的结果。",
            img_alt: "什么是调解"
          }, whyChoose: {
            heading_part1: "为什么选择 PMA 的",
            heading_part2: "调解服务",
            heading_part3: "？",
            cards: {
              card1: {
                title: "高效且极具成本效益",
                desc: "在数周内化解矛盾争议，而非耗费数年。"
              },
              card2: {
                title: "严格保密",
                desc: "私密安全的调解过程，不留任何公开记录。"
              },
              card3: {
                title: "维护彼此关系",
                desc: "专注于相互理解，寻求实现双赢的解决方案。"
              },
              card4: {
                title: "灵活且注重协作",
                desc: "争议各方对最终结果和决定拥有完全的控制权。"
              },
              card5: {
                title: "IMI 认证标准",
                desc: "国际公认的调解员专业资质认证。"
              }
            }
          },
          banner: {
            text: "PMA 是巴基斯坦<strong>首家且历史最悠久</strong>的致力于调解认证、专业培训和行业倡导的专职机构——<strong>成立于 2013–2014 年</strong>，总部位于卡拉奇。"
          },
          how_it_works: {
            title_part1: "调解服务如何",
            title_part2: "开展？",
            img_alt: "调解流程",
            steps: {
              step1: {
                num: "1",
                title: "提交您的申请",
                desc: "您联络 PMA 并提供您的争议细节信息。"
              },
              step2: {
                num: "2",
                title: "初步案件评估",
                desc: "我们评估相关事宜，并确定其是否适合通过调解解决。"
              },
              step3: {
                num: "3",
                title: "指定专属调解员",
                desc: "我们将为您的案件分配一位中立且具备专业资质的调解员。"
              },
              step4: {
                num: "4",
                title: "协助开展调解会",
                desc: "调解员将促进结构化对话，引导各方共同探索解决方案。"
              },
              step5: {
                num: "5",
                title: "达成共识与协议",
                desc: "争议各方达成相互接受的结果，并正式签署和解协议。"
              }
            }
          },
          who_we_serve: {
            title_part1: "我们的",
            title_part2: "服务对象",
            cards: {
              card1: {
                title: "个人与家庭",
                desc: "协助个人及家庭化解各类私人与民事纠纷。"
              },
              card2: {
                title: "企业与公司",
                desc: "支持各类商业机构解决商事及职场内部争议。"
              },
              card3: {
                title: "政府机构",
                desc: "协助政府部门高效解决公共服务领域的争端。"
              },
              card4: {
                title: "非政府组织与社区团体",
                desc: "促进社区及社会公益组织内部与外部的矛盾化解。"
              },
              card5: {
                title: "律师事务所与法律从业者",
                desc: "与法律界专业人士携手合作，提供高效的多样化纠纷解决机制（ADR）方案。"
              }
            }
          },
          cta: {
            title_part1: "让我们共同",
            title_part2: "和平化解争议。",
            subtitle: "调解凝聚共识，共识孕育方案。欢迎立即联络 PMA，了解调解服务如何为您提供协助。",
            btn_text: "立即联系我们"
          }
        },
        "services-page": {
          hero: {
            img_alt: "服务核心主图",
            eyebrow: "我们的服务",
            title_part1: "专业调解与",
            title_part2: "多样化纠纷解决机制（ADR）服务",
            lead: "PMA 提供全方位的调解、培训和咨询服务，旨在协助个人、各类组织及机构高效化解争议，并共同构建积极对话的文化背景。"
          },
          work_with: {
            title_part1: "我们的",
            title_part2: "合作",
            title_part3: "群体",
            items: {
              item1: "律师事务所与法律从业者",
              item2: "各大企业与商业机构",
              item3: "政府机构",
              item4: "非政府组织与社区团体",
              item5: "教育机构",
              item6: "司法部门与公共领域"
            }
          },
          services_cta: {
            title_part1: "让我们携手共建",
            title_part2: "更完善的纠纷解决 system。",
            subtitle: "与 PMA 携手合作，为您量身定制调解服务、专业培训及咨询解决方案。",
            btn_text: "取得联系"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "联系我们 page 主图",
            eyebrow: "联系我们",
            title_part1: "我们随时为您",
            title_part2: "提供 column 帮助。",
            lead: "无论您有任何疑问、需要指导还是希望与我们展开合作，我们的团队都已准备就绪为您提供支持。请随时联系我们，我们将在第一时间为您解答。",
            features: {
              f1_title: "严格保密",
              f1_desc: "您的个人信息将始终受到隐私保护",
              f2_title: "快速响应",
              f2_desc: "我们通常会在 24 小时内完成回复",
              f3_title: "专业团队",
              f3_desc: "由经验丰富的调解专家组成的专业团队"
            }
          },
          "contact_section": {
            "info_col": {
              "title": "取得联系",
              "lead": "我们随时为您解答疑问，并为您在调解之旅中提供所需的全力支持。",
              "labels": {
                "address": "办公地址",
                "email": "电子邮箱",
                "phone": "电话",
                "whatsapp": "WhatsApp",
                "hours": "办公时间"
              },
              "values": {
                "address_text": "巴基斯坦，卡拉奇 75400，沙赫拉·费萨尔大道旁，P.E.C.H.S. 街区 6，253 号",
                "hours_text": "星期一 – 星期五 上午 9:00 – 下午 5:00（巴基斯坦标准时间）"
              }
            },
            "form_col": {
              "title": "给我们留言",
              "lead": "请提供一些详细信息，我们的团队将尽快给您回复。",
              "labels": {
                "name": "全名",
                "email": "电子邮箱",
                "phone": "电话号码",
                "inquiry": "咨询类型",
                "subject": "主题",
                "message": "留言内容",
                "consent": "所有沟通内容均严格保密，您的个人信息安全无虞。"
              },
              "placeholders": {
                "name": "您的姓名",
                "email": "您的邮箱",
                "phone": "您的电话",
                "subject": "留言主题",
                "message": "请问有什么可以帮您？"
              },
              "options": {
                "default": "请选择一个选项",
                "general": "常规咨询",
                "mediation": "调解服务",
                "training": "培训与认证",
                "membership": "会员信息咨询",
                "advisory": "机构多元化纠纷解决机制（ADR）咨询服务",
                "workshops": "研讨会与宣讲会",
                "event": "活动参与",
                "partnership": "伙伴关系与商务合作",
                "media": "媒体与新闻采访咨询",
                "consultation": "法律与政策咨询",
                "feedback": "投诉与意见反馈",
                "volunteer": "志愿者机会",
                "speaker": "演讲者/培训师邀请需求",
                "corporate": "企业调解支持",
                "community": "社区调解支持",
                "support": "网站技术支持"
              },
              "btn_text": "发送留言",
              "success_msg": "您的留言已成功发送。我们通常会在 24 小时内与您取得联系。",
              "error_msg": "抱歉，发送您的留言时出现错误。请稍后重试。",
              "note": "无需法律诉讼，无需对簿公堂，唯有圆满解决。我们通常在 24 小时内回复。"
            }
          },
          "map_section": {
            "title": "欢迎光临我们的办公室",
            "lead": "我们竭诚欢迎您莅临我们位于卡拉奇的办公室。",
            "iframe_title": "PMA 办公室位置 — 巴基斯坦，卡拉奇，P.E.C.H.S. 街区 6，253 号"
          }
        },
        "faq_page": {
          "hero": {
            "img_alt": "常见问题 page 主图",
            "title": "常见问题",
            "lead": "在这里查找关于调解服务和我们机构最常见问题的解答。"
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "什么是标准调解条款？",
                "answer": "本协议各方之间可能发生的任何及所有争议、分歧或问题，首先应由各方尝试通过友好协商加以解决。如果自一方收到另一方友好解决请求后三十（30）天内，无法通过书信或相互讨论友好或圆满地解决争议、分歧或问题，则应提交给 PMA 认可的调解员小组进行调解。调解程序将受国际公认的调解规则约束。"
              },
              "q2": {
                "question": "时间和成本的替代方案 —— 调解",
                "answer": "与冗长的法律诉讼相比，调解提供了一种更快、更具成本效益且保密的替代方案。它有助于各方友好解决争议，同时维护专业和个人关系。"
              },
              "q3": {
                "question": "什么是调解？",
                "answer": "调解是一个自愿且保密的过程，由中立的第三方协助争议各方达成相互接受的协议。"
              },
              "q4": {
                "question": "如何尝试调解？",
                "answer": "您可以通过我们的网站或办公室联系 PMA 以启动调解服务。我们的团队将引导您完成整个流程，并为您联系获得认证的调解员。"
              },
              "q5": {
                "question": "调解的好处",
                "benefits_list": {
                  "b1": "更快的争议解决速度",
                  "b2": "更低的法律成本",
                  "b3": "保密的调解程序",
                  "b4": "灵活的解决方案",
                  "b5": "改善各方之间的沟通"
                }
              },
              "q6": {
                "question": "调解会议何时举行？",
                "answer": "调解会议的时间安排取决于双方以及调解员的可用时间。PMA 将协调该流程，以确保便利和高效。"
              },
              "q7": {
                "question": "调解过程中会发生什么？",
                "answer": "在调解期间，双方将在调解员协助的结构化环境中讨论他们所关心的问题，调解员将帮助探索解决方案和共同基础。"
              },
              "q8": {
                "question": "如果未能达成协议会怎么样？",
                "answer": "如果调解未能达成协议，双方仍可自由寻求其他可用的法律或争议解决途径。"
              },
              "q9": {
                "question": "谁可以参加调解？",
                "answer": "只有相关各方、其授权代表、法律顾问（如获允许）以及调解员可以参加调解会议。"
              },
              "q10": {
                "question": "费用是多少？",
                "answer": "调解费用取决于争议的性质、复杂程度和持续时间。PMA 会在调解程序开始前提供详细的费用说明。"
              }
            },
            "contact_box": {
              "title": "还有其他问题吗？",
              "lead": "我们随时为您提供帮助。请联系我们，我们的团队将竭诚为您服务。",
              "btn_text": "联系我们"
            }
          }
        },
        "training-page": {
          "hero": {
            "hero_img_alt": "培训页面主图",
            "eyebrow": "专业培训",
            "title_part1": "通过国际公认的培训",
            "title_part2": "培养巴基斯坦未来的调解员",
            "lead": "强化您的技能。提升您的专业实践。在社会中促进对话、理解与和平解决争议。",
            "banner": {
              "logo_alt": "国际调解学院",
              "title": "IMI 认证调解员培训项目",
              "tagline": "国际公认。全球推崇。",
              "desc": "PMA 是国际调解学院 (IMI) 官方注册的培训机构。我们获得 IMI 认证的调解员培训项目符合专业调解员培训的最高全球标准。",
              "link_text": "欲了解更多信息，请点击此链接"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "我们的",
              "title_part2": "培训",
              "title_part3": "项目"
            },
            "programs": {
              "accredited_course": {
                "badge": "认证课程",
                "title": "调解技能认证课程",
                "desc_p1": "本课程适合那些有兴趣了解调解技能的人士。学员将成为理性的调解服务消费者。",
                "desc_p2": "所有课程均通过练习和角色扮演进行。",
                "metrics": {
                  "total_hours": "总学时",
                  "days": "天数（周二至周六）",
                  "daily_hours": "每日学时",
                  "cert_status": "证书",
                  "cert_sub": "已认证"
                },
                "outcomes": {
                  "headline": "课程结束时，学员应能够：",
                  "list": {
                    "item1": "熟练掌握调解技能",
                    "item2": "学习调解的最佳实践",
                    "item3": "了解巴基斯坦关于调解的法律",
                    "item4": "学习谈判技巧",
                    "item5": "成为认证调解员"
                  }
                },
                "btn_text": "查看课程详情"
              },
              "introductory_course": {
                "badge": "非认证课程",
                "title": "调解技能入门课程",
                "desc_p1": "本课程适合那些有兴趣了解调解技能基础概念的人士。这是一门非常基础级别的课程。",
                "desc_p2": "不包含任何练习或角色扮演。",
                "metrics": {
                  "total_hours": "总学时",
                  "days": "天数（待公布）",
                  "daily_hours": "每日学时",
                  "cert_status": "非认证"
                },
                "btn_text": "查看课程详情"
              },
              "basic_info_course": {
                "badge": "非认证课程",
                "title": "调解技能基本信息课程",
                "desc_p1": "本课程适合那些有兴趣了解调解技能基础概念的人士。这是一门非常基础级别的课程。",
                "desc_p2": "不包含任何练习或角色扮演。",
                "metrics": {
                  "total_hours": "总学时",
                  "days": "天数（1天）",
                  "daily_hours": "每日学时",
                  "cert_status": "非认证"
                },
                "btn_text": "查看课程详情"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "谁",
              "title_part2": "应当",
              "title_part3": "参加？",
              "subtitle": "本培训专为渴望创造改变的专业人士设计"
            },
            "cards": {
              "c1": {
                "title": "律师及法律专业人士",
                "desc": "提升您的争议解决技能，并拓展您的专业实践范围。"
              },
              "c2": {
                "title": "法官及法院官员",
                "desc": "加强您对多元化纠纷解决机制（ADR）的理解，并支持案件的高效管理。"
              },
              "c3": {
                "title": "企业及职场专业人士",
                "desc": "改善职场中的谈判、沟通以及冲突管理能力。"
              },
              "c4": {
                "title": "人力资源及行政专业人士",
                "desc": "构建以人为本的冲突解决方案，促进职场和谐。"
              },
              "c5": {
                "title": "非政府组织（NGO）及社区领袖",
                "desc": "化解社区纠纷，促进社会凝聚力与包容性。"
              },
              "c6": {
                "title": "学生及 ADR 爱好者",
                "desc": "开启您的调解之旅，在多元化纠纷解决（ADR）领域打下坚实基础。"
              },
              "c7": {
                "title": "政府官员",
                "desc": "将调解技能应用于公共部门的争议解决和政策执行中。"
              },
              "c8": {
                "title": "任何对 ADR 和调解感兴趣的人士",
                "desc": "面向所有对和平对话与化解争议充满热情的人员开放。"
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "不同的背景，同一个目标",
            "title": "不同的背景。同一个目标：和平解决。",
            "desc": "我们的培训汇聚了来自各个领域的专业人士，他们坚信对话、理解以及构建更美好的社区。",
            "btn_text": "报名参加课程"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "加入我们的项目",
              "title": "加入我们的调解培训项目",
              "tagline": "迈向卓越的第一步",
              "desc": "立即注册，加入国际认可的培训项目，旨在提升您的技能、赋能您的实践并促进社会的和平解决。",
              "img_alt": "禅修冥想石",
              "seat_badge": {
                "title": "锁定您的席位",
                "desc_part1": "名额有限",
                "desc_part2": "每期班级提供。"
              }
            },
            "form_panel": {
              "header_title": "报名信息详情",
              "labels": {
                "name": "姓名",
                "email": "电子邮箱",
                "phone": "手机号码",
                "background": "专业背景",
                "city": "城市",
                "program": "选择培训课程",
                "additional_info": "附加信息（选填）"
              },
              "placeholders": {
                "name": "请输入您的全名",
                "email": "请输入您的电子邮箱",
                "phone": "请输入您的手机号码",
                "background": "例如：律师、人力资源、学生",
                "city": "请输入您所在的城市",
                "program_default": "-- 请选择一个课程 --",
                "additional_info": "您想分享 liquor 的任何其他补充信息"
              },
              "options": {
                "accredited": "调解技能认证课程",
                "introductory": "调解技能入门课程",
                "basic": "调解技能基本信息课程"
              },
              "btn_text": "申请报名",
              "privacy_note": "您的信息非常安全，将仅用于本次课程报名。",
              "messages": {
                "success": "报名信息提交成功！我们将在 24 小时内与您联系。",
                "error": "抱歉，提交您的报名申请时出错。请稍后重试。"
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "IMI 官方认可",
                "desc": "我们的项目均通过国际调解学院 (IMI) 的认证。"
              },
              "b2": {
                "title": "专家级导师",
                "desc": "向经验丰富的调解员和行业资深专业人士学习。"
              },
              "b3": {
                "title": "国际化标准",
                "desc": "培训课程紧密贴合全球公认的调解业务标准。"
              },
              "b4": {
                "title": "专业技能认证",
                "desc": "顺利完成课程后将荣获行业认可的结业证书。"
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "认证课程",
              "title_part1": "调解技能",
              "title_part2": "认证课程",
              "desc": "本课程适合那些有兴趣了解调解技能的人士。学员将成为理性的调解服务消费者。所有课程均通过练习和角色扮演进行。",
              "stats": {
                "type": { "label": "课程类型", "value": "官方认证证书" },
                "total_hours": { "label": "总学时", "value": "40" },
                "duration": { "label": "课程周期", "value": "5天（一周）" },
                "daily_hours": { "label": "每日学时", "value": "8" },
                "days": { "label": "培训日", "value": "周二至周六" },
                "time": { "label": "培训时间", "value": "上午 9 点至下午 5 点" }
              }
            },
            "main_content": {
              "about": {
                "title": "关于本课程",
                "desc": "本系统化项目旨在赋予学员实用的调解技能、谈判技巧以及对巴基斯坦调解法律的深度理解。通过体验式学习、实操练习和角色扮演，学员将做好充分准备，以高效且合乎职业道德的方式应对现实生活中的各类争议。"
              },
              "outcomes": {
                "title": "您将收获什么",
                "items": [
                  "熟练掌握调解核心技能",
                  "学习调解业务的最佳实践",
                  "深入了解巴基斯坦调解法律",
                  "掌握高阶谈判技巧",
                  "成为行业认证的调解员",
                  "起草切实有效的和解协议"
                ]
              },
              "columns": {
                "outline": {
                  "title": "课程大纲",
                  "items": [
                    "多元化纠纷解决机制（ADR）概述",
                    "调解的各个阶段与流程",
                    "语言与非语言沟通技巧",
                    "谈判风格与策略分析",
                    "课堂提问与核心盘问技术",
                    "潜在协议空间（ZOPA）界定",
                    "打破僵局与化解死结的策略",
                    "和解协议书的草拟要点",
                    "适合采用调解机制的案件类型",
                    "个人技能自我评估",
                    "商务议价与妥协技巧"
                  ]
                },
                "structure": {
                  "title": "课程结构",
                  "modules": [
                    { "badge": "模块 01", "title": "ADR 背景与大局观" },
                    { "badge": "模块 02", "title": "调解流程与阶段划分" },
                    { "badge": "模块 03", "title": "高效沟通与提问艺术" },
                    { "badge": "模块 04", "title": "谈判实战技巧" },
                    { "badge": "模块 05", "title": "争议僵局破局方案" },
                    { "badge": "模块 06", "title": "和解书起草与结案" },
                    { "badge": "模块 07", "title": "自我评估与国际最佳实践" }
                  ]
                },
                "methodology": {
                  "title": "教学方法",
                  "items": [
                    "体验式互动学习",
                    "实战性课题练习",
                    "情景角色扮演与模拟法庭",
                    "小组深度座谈研讨",
                    "真实典型案例分析",
                    "双向互动答疑课"
                  ]
                }
              },
              "certification": {
                "title": "结业资质",
                "desc": "学员在圆满完成所有规定课程后，将获得官方颁发的结业证书。本课程旨在培养个人在多变的环境中，以合规、专业且充满智慧的方式运用调解手段。"
              },
              "attendees": {
                "title": "谁应当参加？",
                "items": [
                  "律师及法律专业人士",
                  "法官及法院官员",
                  "企业及职场专业人士",
                  "人力资源及行政专业人士",
                  "非政府组织（NGO）及社区领袖",
                  "学生及 ADR 爱好者"
                ]
              },
              "btn_text": "申请报名此项目"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "非认证课程",
              "title_part1": "调解技能",
              "title_part2": "入门课程",
              "desc": "本课程适合那些有兴趣了解调解技能基础概念的人士。这是一门非常基础级别的课程，且不包含官方认证。",
              "stats": {
                "type": { "label": "非认证课程", "value": "" },
                "total_hours": { "label": "总学时", "value": "16" },
                "duration": { "label": "课程周期", "value": "2 个工作日" },
                "daily_hours": { "label": "每日学时", "value": "8" },
                "days": { "label": "培训日", "value": "任意两天（待公布）" },
                "time": { "label": "培训时间", "value": "上午 9 点至下午 5 点" }
              }
            },
            "main_content": {
              "about": {
                "title": "关于本课程",
                "desc": "本入门课程提供对调解技能和调解流程的基本认识。学员将成为明智的调解服务消费者，并能理解该领域为个人带来的未来前景。本课程完全以理论为导向，不包含任何实操练习或角色扮演。"
              },
              "outcomes": {
                "title": "您将收获什么",
                "items": [
                  "理解调解的核心基础知识",
                  "学习关键的调解基础概念",
                  "明白在何种情况下适用调解机制",
                  "培养对调解流程的全面认识",
                  "成为理性且知情的调解服务消费者"
                ]
              },
              "columns": {
                "outline": {
                  "title": "课程大纲",
                  "items": [
                    "多元化纠纷解决机制（ADR）概述",
                    "调解的各个阶段与流程",
                    "语言与非语言沟通技巧",
                    "谈判风格与基本类型",
                    "课堂提问的基础技术",
                    "潜在协议空间（ZOPA）概念",
                    "打破常规僵局的基本方法",
                    "和解协议书的草拟初步",
                    "适合采用调解机制的案件类型",
                    "商务议价基本策略"
                  ]
                },
                "info_table": {
                  "title": "课程信息",
                  "trainer": { "label": "授课导师", "value": "待公布 (TBA)" },
                  "daily_hours": { "label": "每日学时", "value": "八 (8) 学时" },
                  "total_hours": { "label": "总学时", "value": "十六 (16) 学时" },
                  "days": { "label": "培训时间", "value": "任意两天（具体安排待公布）" },
                  "time": { "label": "时间段", "value": "上午 9 点至下午 5 点" },
                  "duration": { "label": "课程时长", "value": "两 (2) 个工作日" },
                  "type": { "label": "课程性质", "value": "非认证普通课程" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "谁应当参加？",
                  "items": [
                    "高校学生及应届毕业生",
                    "来自任何领域的职场专业人士",
                    "人力资源及行政管理人员",
                    "非政府组织（NGO）及社区工作者",
                    "任何对调解机制感兴趣的大众"
                  ]
                },
                "note": {
                  "title": "重要提示",
                  "desc": "这是一门普及型初级课程，仅旨在传授基础知识和提高认知。本课程中不设任何模拟练习、角色扮演或个人能力评估环节。"
                }
              },
              "btn_text": "报名参加此课程"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "非认证课程",
              "title_part1": "关于调解技能的",
              "title_part2": "基本信息课程",
              "desc": "本入门课程旨在普及对调解技能及其应用的通识性认识。这是一门极其基础级别的非认证课程。",
              "stats": {
                "type": { "label": "非认证课程", "value": "" },
                "total_hours": { "label": "总学时", "value": "8" },
                "duration": { "label": "课程周期", "value": "1 天" },
                "daily_hours": { "label": "每日学时", "value": "8" },
                "days": { "label": "培训日", "value": "任意一天（待公布）" },
                "time": { "label": "培训时间", "value": "上午 9 点至下午 5 点" }
              }
            },
            "main_content": {
              "about": {
                "title": "关于本课程",
                "desc": "本基本信息课程旨在提供有关调解技能、调解流程和纠纷解决核心概念的普及教育。学员无需参与复杂的角色扮演或实操练习，即可获得关于调解机制运作方式的奠基性认知。"
              },
              "outcomes": {
                "title": "您将收获什么",
                "items": [
                  "理解调解的核心基础知识",
                  "学习关键的调解基础概念",
                  "明白在何种情况下适用调解机制",
                  "培养对调解流程的全面认识",
                  "纠纷解决的基石型概念"
                ]
              },
              "columns": {
                "outline": {
                  "title": "课程大纲",
                  "items": [
                    "多元化纠纷解决机制（ADR）概述",
                    "调解的各个阶段与流程",
                    "调解通识导论",
                    "调解流程框架概览",
                    "调解中的沟通技巧",
                    "提问与澄清技术",
                    "认识僵局与对策思考",
                    "和解协议的构成基础"
                  ]
                },
                "info_table": {
                  "title": "课程信息",
                  "trainer": { "label": "授课导师", "value": "待公布 (TBA)" },
                  "daily_hours": { "label": "每日学时", "value": "八 (8) 学时" },
                  "total_hours": { "label": "总学时", "value": "八 (8) 学时" },
                  "days": { "label": "培训时间", "value": "任意一天（具体安排待公布）" },
                  "time": { "label": "时间段", "value": "上午 9 点至下午 5 点" },
                  "duration": { "label": "课程时长", "value": "一 (1) 天" },
                  "type": { "label": "课程性质", "value": "非认证普通课程" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "谁应当参加？",
                  "items": [
                    "高校学生及应届毕业生",
                    "来自任何领域的职场专业人士",
                    "人力资源及行政管理人员",
                    "非政府组织（NGO）及社区工作者",
                    "任何对调解机制感兴趣的大众"
                  ]
                },
                "note": {
                  "title": "重要提示",
                  "desc": "这是一门普及型常识初级课程，仅旨在传授常识和提高宏观认知。本课程中不设任何模拟演练、角色扮演或能力自评环节。"
                }
              },
              "btn_text": "报名参加此课程"
            }
          }
        },
        "leadership_page": {
          "hero": {
            "eyebrow": "领导团队",
            "title_main": "领导团队",
            "title_accent": "以人为本，核心力量",
            "lead_text": "结识引领 PMA 使命的专业团队，致力于在巴基斯坦全境推动对话、增进理解并促进和平解决争端。"
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "执行团队",
              "sub_committee": "分委会",
              "mediator": "调解员",
              "trainer": "培训师",
              "former_president": "历任主席"
            },
            "search_placeholder": "按姓名或专业领域搜索..."
          },
          "members": {
            "member_1": {
              "name": "阿加·扎法尔·艾哈迈德 (Aga Zafar Ahmed)",
              "title": "主席",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 阿加·扎法尔·艾哈迈德 的个人资料"
            },
            "member_2": {
              "name": "赛玛·阿敏·卡瓦贾 (Saima Amin Khawaja)",
              "title": "副主席 – 北区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 赛玛·阿敏·卡瓦贾 的个人资料"
            },
            "member_3": {
              "name": "阿斯凡德·亚尔·阿里·汗 (Asfand Yar Ali Khan)",
              "title": "副主席 – 北区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 阿斯凡德·亚尔·阿里·汗 的个人资料"
            },
            "member_4": {
              "name": "赛义德·哈比卜 (Saeed Habib)",
              "title": "副主席 – 南区",
              "badges": {
                "executive_team": "执行团队"
              },
              "aria_label": "查看 赛义德·哈比卜 的个人资料"
            },
            "member_5": {
              "name": "沙巴娜·阿里 (Shabana Ali)",
              "title": "副主席 – 南区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "pma_accredited": "PMA 认证调解员"
              },
              "aria_label": "查看 沙巴娜·阿里 的个人资料"
            },
            "member_6": {
              "name": "瓦吉哈·阿利姆 (Wajiha Aleem)",
              "title": "秘书长",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 瓦吉哈·阿利姆 的个人资料"
            },
            "member_7": {
              "name": "赛义德·萨马德·乌尔·哈克 (Syed Sammad-ul-Haque)",
              "title": "财务秘书",
              "badges": {
                "executive_team": "执行团队"
              },
              "aria_label": "查看 赛义德·萨马德·乌尔·哈克 的个人资料"
            },
            "member_8": {
              "name": "塔里克·赛义德·拉纳 (Tariq Saeed Rana)",
              "title": "执行委员会 – 北区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 塔里克·赛义德·拉纳 的个人资料"
            },
            "member_9": {
              "name": "胡玛·沙阿 (Huma Shah)",
              "title": "执行委员会 – 北区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 胡玛·沙阿 的个人资料"
            },
            "member_10": {
              "name": "乌迈玛·安瓦尔·汗 (Umaimah Anwar Khan)",
              "title": "执行委员会 – 南区",
              "badges": {
                "executive_team": "执行团队"
              },
              "aria_label": "查看 乌迈玛·安瓦尔·汗 的个人资料"
            },
            "member_11": {
              "name": "穆斯坦西尔·扎基尔 (Mustansir Zakir)",
              "title": "执行委员会 – 南区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 穆斯坦西尔·扎基尔 的个人资料"
            },
            "member_12": {
              "name": "阿德南·穆夫蒂 (Adnan Mufti)",
              "title": "执行委员会 – 南区",
              "badges": {
                "executive_team": "执行团队",
                "mediator": "调解员",
                "cedr_accredited": "CEDR 认证调解员"
              },
              "aria_label": "查看 阿德南·穆夫蒂 的个人资料"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "穆斯坦西尔·扎基尔 (Mustansir Zakir)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "director_training": "培训总监",
                "ex_president": "前任主席"
              },
              "aria_label": "查看 穆斯坦西尔·扎基尔 的个人资料"
            },
            "trainer_2": {
              "name": "安瓦尔·卡西夫· ممتاز (Anwar Kashif Mumtaz)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "ex_president": "前任主席",
                "leadership_trainer": "领导力培训师"
              },
              "aria_label": "查看 安瓦尔·卡西夫· ممتاز 的个人资料"
            },
            "trainer_3": {
              "name": "塔里克·赛义德·拉纳 (Tariq Saeed Rana)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "ex_president": "前任主席",
                "executive_committee_north": "执行委员会 – 北区"
              },
              "aria_label": "查看 塔里克·赛义德·拉纳 的个人资料"
            },
            "trainer_4": {
              "name": "赛玛·阿敏·卡瓦贾 (Saima Amin Khawaja)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "executive_member": "执行委员",
                "vice_president_north": "副主席 – 北区"
              },
              "aria_label": "查看 赛玛·阿敏·卡瓦贾 的个人资料"
            },
            "trainer_5": {
              "name": "胡玛·沙阿 (Huma Shah)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "executive_committee_north": "执行委员会 – 北区",
                "training_committee": "培训委员会"
              },
              "aria_label": "查看 胡玛·沙阿 的个人资料"
            },
            "trainer_6": {
              "name": "乌斯曼·G·拉希德 (Usman G. Rashid)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "barrister_at_law": "出庭律师 (Barrister)",
                "former_secretary_general": "前任秘书长 – PMA"
              },
              "aria_label": "查看 乌斯曼·G·拉希德 的个人资料"
            },
            "trainer_7": {
              "name": "阿斯凡德·亚尔·阿里·汗 (Asfand Yar Ali Khan)",
              "title": "高级培训师",
              "badges": {
                "master_trainer": "高级培训师",
                "executive_leadership": "高管领导力",
                "vice_president_north": "副主席 – 北区"
              },
              "aria_label": "查看 阿斯凡德·亚尔·阿里·汗 的个人资料"
            }
          },
          "modal": {
    "about_label": "关于",
    "expertise_title": "专业领域",
    "training_expertise_title": "培训专长",
    "accreditations_title": "认证资格",
    "education_title": "教育背景",
    "affiliations_title": "专业协会会员",
    "media_title": "媒体与公众参与",
    "coming_soon": "即将推出",
    "profile_close_label": "关闭个人资料"
  },
  "profile_modal": {
"aga_zafar_ahmed": {
    "name": "阿加·扎法尔·艾哈迈德",
    "role": "主席",
    "highlight": "“通过领导力、倡导和卓越的ADR，推进调解与国际争议解决。”",
    "about": "阿加·扎法尔·艾哈迈德先生是巴基斯坦调解员协会（PMA）主席，也是巴基斯坦最高法院的杰出律师，拥有超过21年的法律执业经验。他在海事法、商业争议、国际贸易事务以及替代性争议解决（ADR）领域的专业知识广受认可。作为PMA的创始成员，他继续在巴基斯坦全境推动调解和和平争议解决实践中发挥领导作用。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "执行领导力"],
    "expertise": ["商业争议", "海事法", "国际贸易争议", "企业调解", "民事诉讼", "替代性争议解决 (ADR)"],
    "experience": { "years": "21年以上", "label": "法律执业与争议解决" },
    "accreditations": ["伦敦CEDR认证调解员", "MICADR名册调解员", "PMA认证调解员", "国际仲裁法文凭"],
    "education": ["国际仲裁法文凭 – 英格兰和威尔士法学院"],
    "affiliations": ["巴基斯坦最高法院律师协会", "信德省高等法院律师协会", "巴基斯坦调解员协会 (创始成员)", "巴利亚大学 (前客座教授)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "赛玛·阿明·哈瓦贾",
    "role": "副主席 – 北区",
    "highlight": "“通过教育和机构领导力，促进法律改革、卓越调解和可持续争议解决。”",
    "about": "赛玛·阿明·哈瓦贾女士是巴基斯坦调解员协会（PMA）北区副主席，也是一位资深的法律专业人士，在企业诉讼、宪法、交易咨询和法律改革咨询方面拥有广泛的经验。她是一位接受过国际培训的调解员和高级培训师，致力于推进巴基斯坦的ADR、环境法和专业法律教育。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "培训委员会"],
    "expertise": ["企业诉讼", "宪法", "法律改革与咨询", "环境法", "调解与ADR培训", "气候变化政策"],
    "experience": { "years": "20年以上", "label": "法律执业、培训与咨询" },
    "accreditations": ["CEDR认证调解员", "CEDR高级培训师", "PMA认证调解员", "环境法培训 – 印度M.C. Mehta基金会"],
    "education": ["法学硕士 (LL.M) – 伦敦国王学院"],
    "affiliations": ["巴基斯坦调解员协会", "气候变化委员会 – 拉合尔高等法院", "公务员学院", "司法学院", "拉合尔管理科学大学 (LUMS)", "拉合尔大学学院 (UCL)", "法律研究机构 (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "阿斯凡德·亚尔·阿里·汗",
    "role": "副主席 – 北区",
    "highlight": "“通过领导力、培训和机构专业知识，推进调解、仲裁和法律改革。”",
    "about": "出庭律师阿斯凡德·亚尔·阿里·汗是巴基斯坦调解员协会（PMA）北区副主席，也是该组织的创始成员。他由伦敦林肯法学会授予出庭律师资格，是一位资深的法律与发展从业者，在调解、仲裁、环境法和监管事务方面拥有广泛的专业知识。他积极为加强巴基斯坦各地的ADR实践和法律改革倡议做出贡献。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "行为准则委员会"],
    "expertise": ["仲裁与ADR", "劳工与就业法", "环境法", "家庭与土地争议", "监管事务", "调解培训"],
    "experience": { "years": "20年以上", "label": "法律执业、ADR与仲裁庭领导经验" },
    "accreditations": ["CEDR认证调解员", "CEDR高级培训师", "伦敦特许仲裁员协会会员 (MCIArb)", "PMA认证调解员"],
    "education": ["专业法律技能研究生文凭 – 英国伦敦城市圣乔治学院", "法学学士 (荣誉) – 英国赫尔大学", "哲学硕士 – 巴基斯坦", "硕士 – 巴基斯坦", "学士 – 巴基斯坦"],
    "affiliations": ["巴基斯坦调解员协会 (创始成员)", "伦敦特许仲裁员协会", "开伯尔-普赫图赫瓦省环境保护仲裁庭", "伦敦林肯法学会"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "瓦吉哈·阿利姆",
    "role": "秘书长",
    "highlight": "“通过领导力、创新和国际合作推进调解，为巴基斯坦建立更强大的ADR框架。”",
    "about": "瓦吉哈·阿利姆女士担任巴基斯坦调解员协会（PMA）秘书长，领导旨在加强调解并在巴基斯坦全境将替代性争议解决（ADR）制度化的战略倡议。她拥有超过17年的企业和法律经验，致力于通过创新、政策改革、司法合作和国际伙伴关系，将调解推进为一种可靠、可及且符合国际标准的争议解决机制。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "执行领导力"],
    "expertise": ["替代性争议解决 (ADR)", "企业与法律咨询", "调解培训", "机构发展", "政策改革", "国际ADR合作"],
    "experience": { "years": "17年以上", "label": "企业、法律与ADR领导经验" },
    "accreditations": ["英国CEDR认证调解员", "PMA认证调解员", "国际ADR执业者"],
    "education": ["法学硕士 – 英国", "法学学士 (荣誉) – 卡拉奇大学"],
    "affiliations": ["巴基斯坦调解员协会", "国际ADR与调解网络", "司法与机构ADR倡议"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "阿加·扎法尔·艾哈迈德",
    "role": "高级培训师",
    "highlight": "“通过领导力、倡导和卓越的ADR，推进调解与国际争议解决。”",
    "about": "阿加·扎法尔·艾哈迈德是巴基斯坦最高法院的杰出律师、认证调解员和资深ADR专家，在海事法、民事诉讼、商业争议和国际贸易事务中拥有广泛的专业知识。作为巴基斯坦调解员协会（PMA）主席，他继续在巴基斯坦强化调解实践和促进机构争议解决框架方面发挥关键作用。\n\n他是英国CEDR认证调解员，并在信德省高等法院担任调解员，同时还与穆萨利哈国际ADR中心（MICADR）保持合作。除法律执业外，他还作为客座教授和机构领导者为法律教育和专业发展做出了贡献。",
    "badges": ["高级培训师", "主席", "执行领导力"],
    "expertise": ["ADR与调解培训", "商业争议解决", "海事法", "国际贸易争议", "仲裁与冲突解决", "民事与企业诉讼", "培训讲师 (TOT)"],
    "experience": { "years": "21年以上", "label": "法律执业与争议解决" },
    "accreditations": ["英国CEDR认证调解员", "名册调解员 – 信德省高等法院", "成员 – 穆萨利哈国际ADR中心 (MICADR)", "国际仲裁法文凭 – 英格兰和威尔士"],
    "education": ["国际仲裁法文凭 – 英格兰和威尔士法学院"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "穆萨利哈国际ADR中心 (MICADR)", "信德省高等法院", "巴基斯坦最高法院律师协会", "信德省高等法院律师协会", "巴利亚大学"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "穆斯坦西尔·扎基尔",
    "role": "高级培训师",
    "highlight": "“通过战略领导力和卓越的ADR，引领企业治理和调解培训倡议。”",
    "about": "穆斯坦西尔·扎基尔是一位资深企业领导人、认证调解员和国际公认的ADR培训师，在战略管理、公司治理和争议解决方面拥有丰富的经验。他担任巴基斯坦调解员协会（PMA）的培训总监和执行成员，在巴基斯坦全境推广调解和提高ADR意识方面发挥了重要作用。\n\n他是巴基斯坦特许会计师协会（ICAP）、成本与管理会计师协会（ICMAP）和公司秘书协会（ICSP）的资深会员，目前担任Hashoo集团的首席执行官。他获得了美国康奈尔大学的战略管理认证，以及巴基斯坦公司治理机构的认证董事教育。作为英国CEDR认证调解员和高级培训师，他为巴基斯坦的专业调解培训、领导力发展和机构ADR倡议做出了广泛贡献。",
    "badges": ["高级培训师", "培训总监", "执行委员会 – 南区", "前主席"],
    "expertise": ["ADR与调解培训", "公司治理", "战略管理", "高管领导力发展", "商业争议解决", "培训讲师 (TOT)", "机构能力建设"],
    "experience": { "years": "20年以上", "label": "执行 leadership 与 ADR 培训" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "认证董事 – 巴基斯坦公司治理机构", "战略管理认证 – 美国康奈尔大学"],
    "education": ["巴基斯坦特许会计师协会资深会员 (ICAP)", "巴基斯坦成本与管理会计师协会资深会员 (ICMAP)", "巴基斯坦公司秘书协会资深会员 (ICSP)"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "Hashoo集团", "巴基斯坦酒店协会 (PHA)", "巴基斯坦建筑商与开发商协会 (ABAD)", "巴基斯坦特许会计师协会 (ICAP)", "巴基斯坦公司治理机构", "卡拉奇海童军总会信托"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "瓦吉哈·阿利姆",
    "role": "高级培训师",
    "highlight": "“通过领导力、创新和国际合作推进调解，为巴基斯坦建立更强大的ADR框架。”",
    "about": "瓦吉哈·阿利姆是巴基斯坦高等法院律师、认证调解员和法律专业人士，在企业运营、法律咨询和替代性争议解决（ADR）方面拥有丰富的经验。她目前担任巴基斯坦调解员协会（PMA）秘书长，同时担任Hashoo集团的总经理（运营与法律）。\n\n她拥有英国国际商业法与替代性争议解决硕士学位，是CEDR认证调解员，并在泰国仲裁中心（THAC）等国际机构拥有兼职身份。她在信德省高等法院注册为调解员，并积极参与国内外领先的法律和专业协会。",
    "badges": ["高级培训师", "秘书长", "执行领导力"],
    "expertise": ["ADR与调解培训", "国际商业法", "企业法律咨询", "商业争议解决", "机构ADR发展", "专业技能培训", "冲突解决"],
    "experience": { "years": "17年以上", "label": "企业、法律与ADR领导经验" },
    "accreditations": ["CEDR认证调解员", "名册调解员 – 信德省高等法院", "助理培训师 – PMA", "THAC分会成员 – 泰国仲裁中心"],
    "education": ["国际商业法与ADR硕士 – 英国", "法学学士 (荣誉) – 巴基斯坦"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "泰国仲裁中心 (THAC)", "信德省高等法院", "信德省律师理事会", "卡拉奇律师协会", "国际律师协会", "Hashoo集团"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "胡玛·沙阿",
    "role": "高级培训师",
    "highlight": "“通过领导力、倡导和专业导师制度，推进企业法律卓越与调解培训。”",
    "about": "胡玛·沙阿是一位经验丰富的法律专业人士、企业顾问和获得认证的ADR培训师，拥有超过三十年的法律执业经验。自1993年以来，她曾与巴基斯坦一些最著名的法律机构合作，包括阿斯玛·杰汉吉尔夫人和希纳·吉拉尼女士领导下的AGHS法律援助中心、AGHS法律事务所，以及Surridge & Beecheno律师事务所。\n\n她曾担任SSR&I律师事务所的管理合伙人，目前担任巴基斯坦哈比卜银行（HBL）北区法律负责人。她是巴基斯坦倡导培训计划（由英国英格兰和威尔士律师理事会出庭律师倡导委员会IATC主办）的认证培训师，也是英国CEDR认证的调解员和高级培训师。",
    "badges": ["高级培训师", "执行委员会 – 北区", "培训委员会"],
    "expertise": ["ADR与调解培训", "公司法与商业法", "倡导与法律技能培训", "合同起草与审查", "银行与企业法律咨询", "冲突解决", "培训讲师 (TOT)"],
    "experience": { "years": "30年以上", "label": "法律执业、企业咨询与ADR培训" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "巴基斯坦倡导培训计划认证培训师 (IATC)"],
    "education": ["旁遮普法学院 – 因学术优异两次获得金牌"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "出庭律师倡导委员会 (IATC)", "英格兰和威尔士律师理事会", "哈比卜银行 (HBL)", "旁遮普省律师协会", "AGHS法律援助中心", "Surridge & Beecheno"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "乌斯曼·G·拉希德",
    "role": "高级培训师",
    "highlight": "“将法律倡导、调解专业知识和培训领导力相结合，在巴基斯坦全境建设ADR能力。”",
    "about": "乌斯曼·G·拉希德是英国出庭律师、巴基斯坦高等法院律师、CEDR认证调解员和高级培训师，在法律执业、倡导培训、调解和法律教育方面拥有丰富的经验。他拥有伦敦大学法学学士（荣誉）学位、伦敦国王学院法学硕士学位，并在英国布里斯托的西英格兰大学完成了律师职业课程。他由伦敦林肯法学会授予出庭律师资格。\n\n他曾担任巴基斯坦调解员协会（PMA）秘书长，并在巴基斯坦积极致力于调解意识推广、ADR能力建设和专业法律培训倡议。在法律执业之余，他还参与法律教育和倡议技能培训，特别是为伦敦大学国际课程教授公司法和证据法。\n\n乌斯曼的职业生涯始于Umar Bandial律师事务所，目前通过Inayatullah Chambers独立开展执业。他在诉讼、ADR、法律教育和倡导培训方面的综合专业知识，使他能够有效推动机构ADR发展和专业调解实践。",
    "badges": ["高级培训师", "出庭律师", "PMA前秘书长"],
    "expertise": ["ADR与调解培训", "倡导技能培训", "公司法", "证据法", "商业与民事诉讼", "法律教育与专业发展", "冲突解决"],
    "experience": { "years": "15年以上", "label": "CEDR认证高级培训师、倡导与法律教育专家" },
    "accreditations": ["英国CEDR认证调解员及高级培训师", "林肯法学会出庭律师", "认证倡导培训师"],
    "education": ["法学硕士 – 伦敦大学国王学院", "法学学士 (荣誉) – 伦敦大学", "律师职业课程 – 英国布里斯托西英格兰大学"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "林肯法学会", "拉合尔大学学院", "伦敦大学国际课程", "Inayatullah Chambers 律师事务所"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "阿斯凡德·亚尔·阿里·汗",
    "role": "高级培训师",
    "highlight": "\"通过领导力、培训和机构专业知识，推进调解、仲裁和法律改革。\"",
    "about": "阿斯凡德·亚尔·阿里·汗是一位资深的法律从业者、认证调解员和接受过国际培训的ADR专家，在法律咨询、仲裁、机构发展和调解培训方面拥有丰富的经验。作为S&K合伙人事务所的高级合伙人和巴基斯坦调解员协会（PMA）副主席，他积极致力于加强巴基斯坦的调解与替代性争议解决框架。\n\n他由伦敦林肯法学会授予出庭律师资格，是英国CEDR认证调解员和高级培训师，同时也是伦敦特许仲裁员协会（MCIArb）会员。他的专业背景涵盖法律执业、国际发展倡议、政策参与以及机构咨询，包括与联合国和联合国开发计划署（UNDP）项目的合作。",
    "badges": ["高级培训师", "执行领导力", "副主席 – 北区"],
    "expertise": ["ADR与调解培训", "仲裁与冲突解决", "商业与民事争议", "法律技能发展", "机构ADR能力建设", "专业发展课程", "培训讲师 (TOT)"],
    "experience": { "years": "20+ 年", "label": "法律执业、ADR与仲裁庭领导经验" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "伦敦特许仲裁员协会会员 (MCIArb)", "出庭律师 – 伦敦林肯法学会"],
    "education": ["专业法律技能研究生文凭 – 英国", "法学学士 (荣誉) – 英国", "硕士 – 巴基斯坦", "学士 – 巴基斯坦"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "伦敦特许仲裁员协会", "林肯法学会", "巴基斯坦红新月会 (PRCS)", "巴基斯坦环境法协会", "英国校友会", "联合国发展倡议"],
    "media": []
  },
  "trainer_saima_amin_khawaja": {
    "name": "赛玛·阿明·哈瓦贾",
    "role": "高级培训师",
    "highlight": "“通过教育和机构领导力，促进法律改革、卓越调解和可持续争议解决。”",
    "about": "赛玛·阿明·哈瓦贾女士是一位资深的法律专业人士、认证调解员和接受过国际培训的ADR专家，在企业诉讼、宪法、法律咨询和机构改革方面拥有广泛的经验。她在巴基斯坦推广调解意识、ADR培训和法律发展倡议中发挥了关键 historical 作用。\n\n她拥有伦敦国王学院的法学硕士（LL.M）学位，并在印度M.C. Mehta基金会接受了环境法方面的专业培训。作为英国CEDR认证的调解员和高级培训师，她积极投身于专业调解培训和能力建设项目。她曾在拉合尔管理科学大学（LUMS）、公务员学院、司法学院、法律研究机构（TILS）和拉合尔大学学院（UCL）任教，同时还担任由拉合尔高等法院组建的气候变化委员会委员。",
    "badges": ["高级培训师", "执行成员", "副主席 – 北区"],
    "expertise": ["ADR与调解培训", "企业与宪法", "法律改革与政策发展", "环境法", "司法与专业培训", "冲突解决", "培训讲师 (TOT)"],
    "experience": { "years": "20年以上", "label": "法律执业、培训与咨询" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "专业环境法培训 – 印度M.C. Mehta基金会"],
    "education": ["法学硕士 (LL.M) – 伦敦国王学院"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "拉合尔高等法院", "拉合尔管理科学大学 (LUMS)", "公务员学院", "司法学院", "法律研究机构 (TILS)", "拉合尔大学学院 (UCL)", "印度M.C. Mehta基金会"],
    "media": []
  },
  "trainer_tariq_saeed_rana": {
    "name": "塔里克·赛义德·拉纳",
    "role": "高级培训师",
    "highlight": "“通过国际专业知识、专业培训和ADR领导力，引领企业法律执业和卓越调解。”",
    "about": "塔里克·赛义德·拉纳先生是一位高级法律顾问、认证调解员和国际公认的ADR培训师，在公司法和商业法方面拥有丰富的专业知识。他由英国林肯法学会授予出庭律师资格，目前担任Surridge & Beecheno律师事务所公司与商业法部门的主管，并继续为巴基斯坦的调解培训、法律咨询和机构ADR发展做出重大贡献。\n\n他是英国CEDR认证的调解员和高级培训师，在公司治理、法律咨询和专业能力建设方面拥有广泛的经验。他积极开展专业和董事培训课程，同时在法律和商业机构中保持领导地位。",
    "badges": ["高级培训师", "前主席", "执行委员会 – 北区"],
    "expertise": ["ADR与调解培训", "公司法与商业法", "董事培训计划", "公司治理", "商业争议解决", "专业法律发展", "培训讲师 (TOT)"],
    "experience": { "years": "25年以上", "label": "法律执业、ADR与企业顾问" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "林肯法学会出庭律师 – 英国"],
    "education": ["商法法学硕士 – 英国", "法律研究生文凭 – 英国", "法学学士 – 巴基斯坦", "机械工程副学士 – 巴基斯坦"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "伦敦林肯法学会", "英格兰和威尔士律师理事会", "拉合尔高等法院律师协会", "旁遮普省律师理事会", "拉合尔工商会", "Surridge & Beecheno 律师事务所"],
    "media": []
  },
  "saeed_habib": {
    "name": "赛义德·哈比卜",
    "role": "副主席 – 南区",
    "highlight": "",
    "about": "",
    "badges": ["会员委员会", "机构协调"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "shabana_ali": {
    "name": "沙巴娜·阿里",
    "role": "副主席 – 南区",
    "highlight": "“通过倡导、教育和争议解决，促进调解、法律意识和社会正义。”",
    "about": "沙巴娜·阿里女士是巴基斯坦调解员协会（PMA）南区副主席，也是一位在诉讼、咨询服务和争议解决方面拥有深厚背景的资深民事、税务及公司法律师。她积极参与推进巴基斯坦的调解实践，并因其致力于法律赋权、社会正义以及保护妇女和儿童权利而受到广泛认可。",
    "badges": ["执行团队", "调解员", "PMA认证调解员", "律师协调 – 南区", "领导力"],
    "expertise": ["民法", "公司法", "家庭争议", "税务法", "调解与ADR", "妇女与儿童权利倡导"],
    "experience": { "years": "20年以上", "label": "法律执业、调解与公众倡导" },
    "accreditations": ["PMA认证调解员", "注册调解执业者"],
    "education": ["民法、公司法及税务法专业与法律研究"],
    "affiliations": ["巴基斯坦调解员协会", "巴基斯坦公共财政会计师协会 (PIPFA)", "PMA执行委员会", "媒体法律分析师兼演讲嘉宾"],
    "media": ["巴基斯坦电视公司 (PTV)", "Aaj News", "TV One", "Metro News"]
  },
  "syed_sammad_ul_haque": {
    "name": "赛义德·萨马德·哈克",
    "role": "财务秘书",
    "highlight": "",
    "about": "",
    "badges": ["会员委员会", "执行领导力"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "tariq_saeed_rana": {
    "name": "塔里克·赛义德·拉纳",
    "role": "执行委员会 – 北区",
    "highlight": "“通过国际专业知识、专业培训和ADR领导力，引领企业法律执业和卓越调解。”",
    "about": "出庭律师塔里克·赛义德·拉纳是一位高级法律专业人士、认证调解员和高级培训师，在公司法和商业法方面拥有广泛的专业知识。他由英国林肯法学会授予出庭律师资格，目前担任Surridge & Beecheno律师事务所公司与商业法部门的主管。凭借在法律咨询、ADR和专业培训领域数十年的经验，他在推进巴基斯坦调解和机构法律发展中继续发挥着重要的领导作用。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "前主席"],
    "expertise": ["公司法与商业法", "调解与ADR", "国际商业争议", "法律咨询", "公司治理", "专业培训"],
    "experience": { "years": "25年以上", "label": "法律执业、ADR与企业顾问" },
    "accreditations": ["CEDR认证调解员", "CEDR高级培训师", "出庭律师 – 英国林肯法学会", "PMA认证调解员"],
    "education": ["商法法学硕士 – 英国", "法律研究生文凭 – 英国", "法学学士 – 巴基斯坦", "机械工程副学士 – 巴基斯坦"],
    "affiliations": ["英格兰和威尔士律师理事会", "伦敦林肯法学会", "巴基斯坦调解员协会", "拉合尔高等法院律师协会", "旁遮普省律师理事会", "拉合尔工商会"],
    "media": []
  },
  "huma_shah": {
    "name": "胡玛·沙阿",
    "role": "执行委员会 – 北区",
    "highlight": "“通过领导力、倡导和专业导师制度，推进企业法律卓越与调解培训。”",
    "about": "胡玛·沙阿女士是一位高级法律专业人士，在公司法、法律咨询、商业合同起草与审查以及争议解决方面拥有丰富的经验。自1993年执业以来，她曾与包括AGHS法律援助中心、AGHS法律事务所以及Surridge & Beecheno在内的领先法律机构和律师事务所合作。她目前担任巴基斯坦哈比卜银行（HBL）北区法律负责人，并继续为巴基斯坦的调解培训和ADR发展做出重大贡献。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "高级培训师", "培训委员会"],
    "expertise": ["公司法与商业法", "法律咨询", "商业起草与审查", "银行与金融法律事务", "调解与ADR", "倡导培训"],
    "experience": { "years": "30年以上", "label": "法律执业、企业咨询与ADR培训" },
    "accreditations": ["CEDR认证调解员", "CEDR高级培训师", "认证倡导培训师 – IATC (英格兰和威尔士律师理事会)", "PMA认证调解员"],
    "education": ["旁遮普法学院 – 因学术优异两次获得金牌"],
    "affiliations": ["巴基斯坦调解员协会", "英国校阅倡导培训计划（巴基斯坦）", "旁遮普省律师协会", "哈比卜银行 (HBL) – 北区法律负责人"],
    "media": []
  },
  "umaimah_anwar_khan": {
    "name": "乌迈玛·安瓦尔·汗",
    "role": "执行委员会 – 南区",
    "highlight": "",
    "about": "",
    "badges": ["行为准则", "律师协调 – 南区"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "mustansir_zakir": {
    "name": "穆斯坦西尔·扎基尔",
    "role": "执行委员会 – 南区",
    "highlight": "“通过战略领导力和卓越的ADR，引领企业治理和调解培训倡议。”",
    "about": "穆斯坦西尔·扎基尔先生是一位高级企业高管、认证调解员和高级培训师，在公司治理、酒店业、金融和替代性争议解决（ADR）方面拥有丰富的领导经验。目前担任Hashoo集团的首席执行官，他通过在巴基斯坦调解员协会（PMA）内的领导工作，在推动巴基斯坦的调解意识和专业培训倡议方面发挥了重要作用。",
    "badges": ["执行团队", "调解员", "CEDR认证调解员", "培训总监", "高级培训师", "前主席"],
    "expertise": ["公司治理", "战略管理", "调解与ADR培训", "酒店与商业领导力", "财务管理", "机构发展"],
    "experience": { "years": "30年以上", "label": "企业领导力、公司治理与ADR" },
    "accreditations": ["CEDR认证调解员", "CEDR高级培训师", "认证董事教育 – PICG", "战略管理认证 – 美国康奈尔大学"],
    "education": ["巴基斯坦特许会计师协会资深会员 (ICAP)", "巴基斯坦成本与管理会计师协会资深会员 (ICMAP)", "巴基斯坦公司秘书协会资深会员 (ICSP)"],
    "affiliations": ["巴基斯坦调解员协会 (前主席及培训总监)", "Hashoo集团 – 首席执行官", "巴基斯坦酒店协会 (前主席)", "巴基斯坦建筑商与开发商协会 (ABAD)", "卡拉奇海童军总会信托 – 常务受托人"],
    "media": []
  },
  "usman_g_rashid": {
    "name": "乌斯曼·G·拉希德",
    "role": "成员",
    "highlight": "“将法律倡导、调解专业知识和培训领导力相结合，在巴基斯坦全境建设ADR能力。”",
    "about": "乌斯曼·G·拉希德是英国出庭律师、巴基斯坦高等法院律师、CEDR认证调解员和高级培训师，在法律执业、倡导培训、调解和法律教育方面拥有丰富的经验。他拥有伦敦大学法学学士（荣誉）学位、伦敦国王学院法学硕士学位，并在英国布里斯托的西英格兰大学完成了律师职业课程。他由伦敦林肯法学会授予出庭律师资格。\n\n他曾担任巴基斯坦调解员协会（PMA）秘书长，并在巴基斯坦积极致力于调解意识推广、ADR能力建设和专业法律培训倡议。在法律执业之余，他还参与法律教育和倡议技能培训，特别是为伦敦大学国际课程教授公司法和证据法。\n\n乌斯曼的职业生涯始于Umar Bandial律师事务所，目前通过Inayatullah Chambers独立开展执业。他在诉讼、ADR、法律教育和倡导培训方面的综合专业知识，使他能够有效推动机构ADR发展和专业调解实践。",
    "badges": ["调解员", "高级培训师", "出庭律师"],
    "expertise": ["ADR与调解培训", "倡导技能培训", "公司法", "证据法", "商业与民事诉讼", "法律教育与专业发展", "冲突解决"],
    "experience": { "years": "", "label": "CEDR认证调解员及高级培训师" },
    "accreditations": ["英国CEDR认证调解员及高级培训师 – 英国", "林肯法学会出庭律师", "认证倡导培训师"],
    "education": ["法学硕士 – 伦敦大学国王学院", "法学学士 (荣誉) – 伦敦大学", "律师职业课程 – 英国布里斯托西英格兰大学"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "林肯法学会", "拉合尔大学学院", "伦敦大学国际课程", "Inayatullah Chambers 律师事务所"],
    "media": []
  },
  "adnan_mufti": {
    "name": "阿德南·穆夫蒂",
    "role": "执行委员会 – 南区",
    "highlight": "",
    "about": "",
    "badges": ["机构协调", "领导力"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "anwar_kashif_mumtaz": {
    "name": "安瓦尔·卡希夫·穆姆塔兹",
    "role": "高级培训师",
    "highlight": "",
    "about": "安瓦尔·卡希夫·穆姆塔兹先生是一位资深法律专业人士、领导力培训师和认证调解员，在公司法、税务法和争议解决执业方面拥有广泛的经验。作为高等法院律师以及M/s. Saiduddin & Co.律师事务所的高级合伙人，他在巴基斯坦税务与公司法咨询领域建立了极高的声誉。\n\n他是领导力与个人发展领域的国际认证培训师，也是英国CEDR认证调解员及高级培训师。他为法律和企业界的领导力发展、调解意识提升以及专业能力建设做出了显著贡献。他还曾担任巴基斯坦税务律师协会及卡拉奇税务律师协会的秘书长、副主席和主席等重要领导职务。",
    "badges": ["高级培训师", "前主席", "领导力培训师"],
    "expertise": ["领导力与个人发展", "ADR与调解培训", "公司法", "税务法与咨询", "专业发展课程", "冲突解决", "培训讲师 (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["英国CEDR认证调解员", "英国CEDR认证高级培训师", "国际认证培训师 – 领导力与个人发展"],
    "education": ["巴基斯坦高等法院律师"],
    "affiliations": ["巴基斯坦调解员协会 (PMA)", "英国CEDR", "巴基斯坦税务律师协会", "卡拉奇税务律师协会", "巴基斯坦公共利益法律协会 (PILAP)", "M/s. Saiduddin & Co. 律师事务所"],
    "media": []
  }
  },
          "former_presidents": {
            "president_1": {
              "name": "安瓦尔·卡西夫· ممتاز (Anwar Kashif Mumtaz)",
              "title": "前任主席"
            },
            "president_2": {
              "name": "穆斯坦西尔·扎基尔 (Mustansir Zakir)",
              "title": "前任主席"
            },
            "president_3": {
              "name": "塔里克·赛义德·拉纳 (Tariq Saeed Rana)",
              "title": "前任主席"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "小组委员会",
              "subtitle": "我们的小组委员会通过专业知识、协同合作和奉献服务，推动关键举措并支持 PMA 的使命。",
              "expand_all": "展开全部"
            },
            "labels": {
              "mandate": "职责:",
              "director": "总监",
              "convener": "召集人"
            },
            "committees": {
              "training": {
                "title": "培训委员会",
                "mandate": "迎新、培训、认证/认可/进修课程/培训讲师 (TOT)",
                "lead_name": "Mustansir Zakir",
                "members": [
                  "Anwar Kashif Mumtaz",
                  "Saima Khawaja",
                  "Tariq Rana",
                  "Huma Shah",
                  "Asfandyar Ali Khan"
                ]
              },
              "conduct": {
                "title": "行为准则委员会",
                "mandate": "为调解员起草行为准则，并争取获得法律部的批准以在全国范围内实施",
                "lead_name": "Umaima Khan",
                "members": [
                  "Anwar Kashif Mumtaz",
                  "Saima Khawaja",
                  "Khalid Mehmood",
                  "Adnan Mufti",
                  "Tariq Rana",
                  "Asfandyar Ali Khan"
                ]
              },
              "membership": {
                "title": "会员 committee",
                "mandate": "保留和激活老会员，通过邀请其他机构的认可调解员来扩大联合会员组合，并接纳准会员和名誉会员。",
                "lead_name": "Saeed Habib",
                "members": [
                  "Khalid Mehmood",
                  "Saima Khawaja",
                  "Samad Ul Haq",
                  "Asfandyar Ali Khan"
                ]
              },
              "bar_south": {
                "title": "法律与学术协调 – 南部",
                "mandate": "与律师协会/律师公会及法学院协调，组织会议、研讨会、宣讲会和培训/工作坊",
                "lead_name": "Shabana Ali",
                "members": [
                  "Saadat Yar Khan",
                  "Umaima Khan",
                  "Mrs. Khalid Mehmood",
                  "Samad Ul Haq",
                  "Mansoor Meer",
                  "Naved Ahmed"
                ]
              },
              "bar_north": {
                "title": "法律与学术协调 – 北部",
                "mandate": "与律师协会/律师公会及法学院协调，组织会议、研讨会、宣讲会和培训/工作坊",
                "lead_name": "Saima Khawaja",
                "members": [
                  "Zafar Kalanauri",
                  "Barrister Tariq Rana",
                  "Asfandyar Ali Khan"
                ]
              },
              "institutional": {
                "title": "机构协调委员会",
                "mandate": "与商会、行业团体、专业协会/机构进行协调",
                "lead_name": "Adnan Mufti",
                "members": [
                  "Mustansir Zakir",
                  "Saeed Habib",
                  "Tariq Rana",
                  "Asfandyar Ali Khan",
                  "Samad Ul Haq"
                ]
              }
            },
            "footer_note": "Aga Zafar Ahmed（主席）和 Wajiha Aleem（秘书长）是每个委员会的当然成员。"
          },
          "mediators": {
            "adnan-mufti": { "name": "Adnan Mufti", "role": "会员" },
            "anwar-kashif-mumtaz": { "name": "Anwar Kashif Mumtaz", "role": "会员" },
            "ayesha-sarfraz-ali-khan": { "name": "Ayesha Sarfraz Ali Khan", "role": "会员" },
            "barrister-tariq-saeed-lahore": { "name": "Barrister Tariq Saeed", "role": "会员" },
            "farrukh-junaidy": { "name": "Farrukh Junaidy", "role": "会员" },
            "huma-shah": { "name": "Huma Shah", "role": "会员" },
            "ishtiaq-memon": { "name": "Ishtiaq Memon", "role": "会员" },
            "isfandyar-ali-khan": { "name": "Isfandyar Ali Khan", "role": "会员" },
            "khalid-firoz-arfeen": { "name": "Khalid Firoz Arfeen", "role": "会员" },
            "khalid-mahmood-siddiqui": { "name": "Khalid Mahmood Siddiqui", "role": "会员" },
            "mohammad-rehan-siddqui": { "name": "Mohammad Rehan Siddqui", "role": "会员" },
            "mustansir-zakir": { "name": "Mustansir Zakir", "role": "会员" },
            "nausheen-ahmed": { "name": "Nausheen Ahmed", "role": "会员" },
            "neelofar-hameed": { "name": "Neelofar Hameed", "role": "会员" },
            "omair-nisar-khan": { "name": "Omair Nisar Khan", "role": "会员" },
            "raheem-hasnani": { "name": "Raheem Hasnani", "role": "会员" },
            "reshma-aftab": { "name": "Reshma Aftab", "role": "会员" },
            "rubina-virani": { "name": "Rubina Virani", "role": "会员" },
            "saadat-yar-khan": { "name": "Saadat Yar Khan", "role": "会员" },
            "saeed-habib": { "name": "Saeed Habib", "role": "会员" },
            "saima-khawaja": { "name": "Saima Amin Khawaja", "role": "会员" },
            "salina-khalfan": { "name": "Salina Khalfan", "role": "会员" },
            "shabana-ali": { "name": "Shabana Ali", "role": "会员" },
            "shaheen-premani": { "name": "Shaheen Premani", "role": "会员" },
            "syed-haider-imam-rizvi": { "name": "Syed Haider Imam Rizvi", "role": "会员" },
            "syed-sammadul-haque": { "name": "Syed Sammadul Haque", "role": "会员" },
            "tahmasp-r-razvi": { "name": "Tahmasp R. Razvi", "role": "会员" },
            "umaimah-a-rizvi": { "name": "Umaimah A. Rizvi", "role": "会员" },
            "usman-g-rashid": { "name": "Usman G. Rashid", "role": "会员" },
            "wajiha-aleem": { "name": "Wajiha Aleem", "role": "会员" },
            "yousuf-moulvi": { "name": "Yousuf Moulvi", "role": "会员" },
            "zafar-kalanauri": { "name": "Zafar Kalanauri", "role": "会员" },
            "zia-makhdoom": { "name": "Zia Makhdoom", "role": "会员" }
          }
        },
        "resources_page": {
          "hero": {
            "image_alt": "服务核心图片",
            "eyebrow": "资源",
            "title_line1": "知识。法律。",
            "title_accent": "变革。",
            "lead_text": "获取 PMA 出版物、调解法律、机构文件、研究论文、倡导资源以及媒体内容，这些内容支持巴基斯坦替代性纠纷解决机制 (ADR) 的发展与和平化解争端。"
          },
          "tabs": {
            "featured": "精选",
            "downloads": "下载中心",
            "mediation_laws": "调解法律",
            "advocacy": "政策倡导",
            "press_media": "新闻与媒体",
            "articles": "文章报告"
          },
          "downloads_panel": {
            "header": {
              "title": "下载中心",
              "lead": "可下载的 PDF、表格和出版物。点击文件可在新标签页中打开。",
              "view_all_text": "查看全部下载"
            },
            "global_labels": {
              "download_btn_text": "下载 PDF",
              "default_image_alt": "ADR-ACT-2017 PDF 文件"
            },
            "items": {
              "card_1": {
                "title": "2017年替代性纠纷解决法案 (ADR-ACT-2017)",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "政策倡导与游说 (Advocacy and Lobby)",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "注册证书",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "会员申请表",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "公司章程最新版 (Memorandum of Association)",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "提名表",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "PMA 致辞演讲",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "为什么加入 PMA",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "调解法律与立法",
              "lead": "与调解相关的核心法规、法案和官方立法文件。",
              "view_all_text": "查看全部法律"
            },
            "global_labels": {
              "download_btn_text": "下载 PDF",
              "default_image_alt": "ADR-ACT-2017 PDF 文件"
            },
            "items": {
              "card_1": {
                "title": "伊斯兰堡争端解决法案 (调解)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "1908年《民事诉讼法典》第一附表的修订项",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "旁遮普邦1908年《民事诉讼法典》修订案 (调解条款)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "《民事诉讼法典》(信德省修正案) 法案草案，2018年",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "关于调解所达成和解协议的《新加坡公约》(正文)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "政策倡导与政策制定",
              "lead": "支持替代性纠纷解决机制 (ADR) 改革的政策简报、倡导工具包和立场文件。",
              "view_all_text": "查看全部政策倡导"
            },
            "global_labels": {
              "download_btn_text": "下载 PDF",
              "default_image_alt": "ADR-ACT-2017 PDF 文件"
            },
            "items": {
              "card_1": {
                "title": "开伯尔-普赫图赫瓦省 (KPK)",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "旁遮普邦",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "信德省",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "新闻与媒体",
              "lead": "面向记者的供稿、媒体指南和可下载素材资源。",
              "view_all_text": "查看媒体素材"
            },
            "global_labels": {
              "download_btn_text": "下载 PDF",
              "default_image_alt": "PDF 文件"
            },
            "items": {
              "card_1": {
                "title": "《商业记录报》 (Business Recorder)",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "《商业记录报》广告 (AD)",
                "file_name": ""
              },
              "card_3": {
                "title": "《前线邮报》 (Frontier Post)",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "《巴基斯坦观察家报》 (Pakistan Observer)",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "PMA 官方新闻稿",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "《论坛报》 (Tribune)",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "文章与分析",
              "lead": "关于调解和多元化纠纷解决机制 (ADR) 的研究文章、深度分析与行业前沿洞察。",
              "view_all_text": "查看全部文章"
            },
            "global_labels": {
              "download_btn_text": "下载 PDF",
              "author_prefix": "作者："
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "Jawad A. Sarwana",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "It Really Happened in Frankfurt PDF 文件"
              },
              "card_2": {
                "title": "Mediation Techniques (调解技巧)",
                "author": "Jawad A. Sarwana",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "Mediation Techniques PDF 文件"
              }
            }
          },
          "search_bar": {
            "question": "找不到您需要的内容？",
            "subtext": "使用搜索或按分类浏览，快速找到您需要的资源。",
            "placeholder": "搜索资源...",
            "browse_btn_text": "浏览全部资源"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "活动",
            "title": "最新活动",
            "lead": "随时获取 PMA 会议、调解倡议、工作坊以及重要公告的最新动态。",
            "image_alt": "服务主图"
          },
          "tab_bar": {
            "upcoming_events": "即将举办的活动",
            "past_events": "往期活动",
            "announcements": "重要公告"
          },
          "upcoming_panel": {
            "title": "敬请期待",
            "lead": "即将举办的活动、会议和工作坊将在此列出。请稍后回来查看。"
          },
          "announcements_panel": {
            "title": "敬请期待",
            "lead": "重要公告将在此处显示。敬请关注。"
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "往期活动",
                "pill_text": "认证培训项目",
                "view_gallery_btn": "查看活动画册",
                "about_label": "活动介绍",
                "highlights_label": "核心培训亮点"
              },
              "card": {
                "title": "第六届认证调解培训项目",
                "sub": "信德省高等法院",
                "date": "2026年6月8日 至 2026年6月12日",
                "location": "卡拉奇信德省高等法院"
              },
              "about_paragraphs": [
                "巴基斯坦调解员协会 (PMA) 在信德省高等法院成功举办了第六届认证调解培训项目。",
                "该项目旨在加强调解技能，推广多元化纠纷解决机制 (ADR) 实践，并提升法律从业者和调解专业人员的专业能力。",
                "通过互动环节、实际演练和小组协作讨论，参与者对现代调解技巧和纠纷解决框架有了深入而宝贵的理解。"
              ],
              "highlights": [
                "专业认证调解培训课程",
                "调解实战模拟演练",
                "互动式小组专题讨论",
                "多元化纠纷解决 (ADR) 技巧",
                "职业岗位能力建设",
                "协同互助的学习环境"
              ],
              "meta": {
                "objective_label": "培训目标",
                "objective_text": "强化调解技能，推动高效、妥善化解矛盾纠纷的实际应用。",
                "organized_label": "主办单位",
                "organized_text": "巴基斯坦调解员协会 (PMA)",
                "participants_label": "参训人员",
                "participants_text": "法律专业人士、ADR 从业人员、调解员及参训学员。",
                "type_label": "活动类型",
                "type_text": "认证培训项目"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "往期活动",
                "about_label": "活动介绍",
                "highlights_label": "重点阐述的 ADR 进展"
              },
              "card": {
                "title": "调解：前进之路",
                "sub": "第一届全国调解大会",
                "date": "2015年3月7日",
                "location": "卡拉奇万豪酒店",
                "type": "全国性会议"
              },
              "about_paragraphs": [
                "巴基斯坦调解员协会 (PMA) 是巴基斯坦首个代表海外受训及认证调解员以及其他致力于推动该事业发展专业人士的机构。协会成立于2013年，承接了多项此前由国际金融公司/世界银行集团多元化纠纷解决机制 (ADR) 项目实施的活动。",
                "鉴于巴基斯坦当前的合同执行指标不容乐观、耗时较长且成本高昂，PMA 致力引导和支持各项干预措施，以协助诉讼各方通过调解等和解程序友好解决争议，并以此配合和补充司法与法院在及时结案方面的努力。"
              ],
              "highlights": [
                "卡拉奇争议解决中心和拉合尔工商会调解中心全面投入运营。",
                "在巴基斯坦积极推动 ADR/调解法律改革的立法游说。",
                "巴基斯坦本土开始拥有 CEDR 认证调解员与高级培训师。",
                "在巴基斯坦国内开展 ADR 专业课程体系建设。",
                "进一步强化并在巴基斯坦落地交付 ADR 专业培训。",
                "将 ADR 视为解决包括公司治理在内等多元化纠纷的重要渠道。"
              ],
              "meta": {
                "objective_label": "大会宗旨",
                "objective_text": "进一步推进 ADR 及调解事业，探讨在巴基斯坦实现调解制度化所面临的进展、挑战与未来干预方向。",
                "organized_label": "大会主办方",
                "organized_text": "本届大会由巴基斯坦调解员协会主办，并得到了各大会合作伙伴的大力支持。",
                "participants_label": "演讲嘉宾",
                "participants_text": "来自政府、司法界、商界、律师协会、学术界和巴基斯坦各调解中心代表及海外演讲嘉宾。",
                "type_label": "活动类型",
                "type_text": "全国性会议"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "隐私",
            "title_accent": "政策",
            "lead_text": "我们致力于保护您的隐私，并确保以安全和负责任的方式处理您的个人信息。"
          },
          "sections": {
            "commitment": {
              "title": "隐私承诺",
              "paragraphs": [
                "巴基斯坦调解员协会 (PMA) 致力于保护您的在线隐私。巴基斯坦调解员协会 (PMA) 创建了本隐私声明，以展示我们对隐私的坚定承诺。以下披露了巴基斯坦调解员协会 (PMA) 的信息收集和传播惯例。",
                "PMA 保留随时通过通知用户新隐私声明的存在来更改本政策的权利。本声明及其中概述的政策并不旨在且不会在任何一方内部或代表任何一方创建任何合同或其他法律权利。"
              ]
            },
            "respect_data": {
              "title": "尊重用户数据",
              "paragraphs": [
                "巴基斯坦调解员协会 (PMA) 高度重视与客户的牢固关系。巴基斯坦调解员协会 (PMA) 的数据收集工作是在充分、妥善尊重客户隐私的前提下进行的。",
                "我们收集的数据将以敏感、安全的方式进行处理，并对隐私给予妥善的考虑。巴基斯坦调解员协会 (PMA) 不会向第三方披露、分发或销售我们从客户那里收集的数据。"
              ]
            },
            "collection": {
              "title": "信息收集",
              "lead_text": "PMA 收集用于会员注册的信息包括：",
              "items": [
                "计算机化全国身份证 (CNIC)",
                "全名",
                "住宅地址",
                "办公地址",
                "电话号码",
                "电子邮箱信息",
                "其他相关的会员信息"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "投诉与申诉",
            "title_accent": "政策",
            "lead_text": "我们致力于公平、迅速和透明地解决各方关切。"
          },
          "intro_card": {
            "bold_text": "我们拥有一套规范的投诉处理程序，以确保每项投诉都能得到妥善的关切和处理。",
            "lead_p": "任何使用 PMA 调解认证服务的用户均可提出投诉。PMA 旨在向所有用户提供快速且及时的服务。我们将：",
            "commitments": [
              "认真对待并妥善处理所有投诉；",
              "迅速解决投诉问题；以及",
              "从投诉中吸取教训，并采取行动不断改进我们的服务。"
            ]
          },
          "steps": [
            {
              "text": "然而，我们只能处理针对从培训总监处接受到不良客户服务而提出的相关投诉。"
            },
            {
              "text": "这意味着您的诉求必须致信给培训总监，并通过邮寄和电子邮件的形式发送，同时抄送 (cc) 给 PMA 主席。"
            },
            {
              "text": "对培训总监决定不满意的学生可自由拒绝该决定，在这种情况下，该决定将不具任何约束力。总监有义务在收到投诉后的30天内作出答复。"
            },
            {
              "text": "但是，如果您对投诉的处理结果仍不满意，或者培训总监未作答复，您可以将投诉提交给 PMA 主席，主席将组建一个由两名成员组成的教席仲裁庭来听取您的诉求。"
            },
            {
              "text": "您需要清晰、扼要地说明提出请求的原因，以及您希望通过审查或针对培训总监的不作为达到什么目标。由两名成员组成的仲裁庭将向您致信（并抄送 PMA 主席），且务必在提交升级请求后的30个工作日内以书面形式答复您。"
            },
            {
              "text": "如果您对两名成员组成的仲裁庭就您的投诉所采取的行动或不作为仍不满意，这并不会影响任何一方前往消费者权益法院寻求救济的权利，该渠道对所有人开放。"
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "条款与",
            "title_accent": "条件",
            "lead_text": "请仔细阅读这些条款。通过访问和使用我们的网站及服务，即表示您同意遵守以下条款和条件。"
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "培训",
              "preview": "为确认您的预订，您的款项必须在课程开始前提前送达我们的办公室。",
              "body_paragraphs": [
                "如果用户逾期付款，将不被允许参加课程。"
              ]
            },
            {
              "id": "refunds",
              "title": "培训退款",
              "preview": "我们理解生活充满变数。如果您无法按时出席，请尽快致电 021-3452-9768 或发送电子邮件至 info@pma.org.pk 与我们联系。",
              "body_paragraphs": [
                "我们很乐意为您安排替代人员出席，或安排延期转账或退款，我们始终会根据具体情况个案处理。"
              ]
            },
            {
              "id": "membership",
              "title": "会籍取消",
              "preview": "除特殊情况外，会籍费用一律不予退还。",
              "body_paragraphs": [
                "如果您认为您的情况符合特例条件，请与我们联系。每个案例都将由 PMA 会员委员会进行单独审查。"
              ]
            },
            {
              "id": "copyright",
              "title": "版权所有",
              "preview": "本网站及其内容受版权保护。本网站材料的版权归巴基斯坦调解员协会 (PMA) 所有，部分材料的版权归第三方所有。网站的功能和运营版权归 PMA 所有。",
              "body_paragraphs": [
                "您可以使用网页浏览器浏览本网站及其内容，并电子复制和打印本网站部分的纸质副本，且仅限于个人非商业用途。严禁任何其他用途，包括对本网站内容进行复制、修改、分发、传播、再版、展示或演播。"
              ]
            },
            {
              "id": "disclaimer",
              "title": "免责声明",
              "preview": "您同意，您访问和使用本网站必须遵守这些条款及所有适用法律，并自担风险。本网站及其内容按“原样”提供，网站可能包含错误、漏洞和不准确之处，且可能不完整或不是最新的。",
              "body_paragraphs": [
                "除非适用法律另有规定，巴基斯坦调解员协会 (PMA) 对本网站的运营或本网站包含的信息、内容、材料或产品不作任何形式的明示或暗示的陈述或保证。",
                "PMA 及其关联公司、董事、管理人员、员工、代理人、承包商、继承人或受让人均不对因使用本网站或链接到本网站的任何其他网站而引起的或与之相关的任何损害承担责任。该限制适用于您或他人可能遭受的直接、间接、间接引起的、特殊、惩罚性或其他损害，以及利润损失、业务中断或数据或信息丢失的损害。"
              ]
            },
            {
              "id": "translations",
              "title": "谷歌翻译",
              "preview": "为了您的方便，本网站使用由 Google Translate™ 支持的翻译程序进行了翻译。Google Translate™ 的翻译是通过自动化电脑程序完成的，而非由获得认证的专业翻译人员进行。",
              "body_paragraphs": [
                "因此，翻译结果可能不准确或不可靠。请谨慎使用 Google Translate™ 的翻译。翻译内容按“原样”提供，不提供任何形式的保证。由于翻译软件的局限性，某些内容（如图像、视频、Flash 等）可能无法翻译。",
                "PMA 对不完整或不准确的翻译不承担责任，也不对用户因使用 Google Translate™ 翻译（或本网站上的任何其他翻译）而引起的任何损害或损失承担责任。",
                "如果您对 Google™ 翻译有任何疑问，请访问：Google Translate™ 常见问题解答。",
                "谷歌不对翻译承担任何明示或暗示的保证，包括任何关于准确性、可靠性的保证，以及任何关于适销性、特定用途适用性和非侵权性的暗示保证。"
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "加入 PMA",
            "title_main": "成为",
            "title_accent": "PMA 会员",
            "lead_text": "加入由调解员、ADR（替代性糾紛解決）专业人士及机构领导者组成的杰出社区，共同致力于和平解决争端。"
          },
          "why_join": {
            "title_main": "为什么",
            "title_accent": "加入",
            "title_end": "PMA？",
            "subtitle": "PMA 会员享有明确的专业优势与发展机遇。",
            "cards": [
              {
                "title": "国际会议",
                "description": "以优惠的费用和优先报名的特权，参加探讨调解与仲裁最新议题的全球会议。"
              },
              {
                "title": "研讨会与课程",
                "description": "获得参与高质量教育研讨会和专业职业发展课程的机会。"
              },
              {
                "title": "专业成长",
                "description": "通过专家的独到见解和优质资源，深化您对调解和 ADR 的理解。"
              },
              {
                "title": "全球网络",
                "description": "建立并维护具有价值的国内与国际专业人脉关系。"
              },
              {
                "title": "商业机遇",
                "description": "拓宽您的商业眼界及专业社交圈。"
              },
              {
                "title": "支持行业发展",
                "description": "在支持和推动调解及和平解决争端的发展中发挥关键作用。"
              }
            ]
          },
          "benefits": {
            "title_main": "会员",
            "title_accent": "权益",
            "subtitle": "作为 PMA 的注册会员，您将享有广泛的独特优势与优质机会。",
            "items": [
              {
                "title": "社交与拓展机会",
                "description": "PMA 全年为会员提供各种机会，以增进专业关系并掌握行业动态与趋势。"
              },
              {
                "title": "会员名录",
                "description": "此名录专供 PMA 会员独享，包含会员及其他全球机构的最新联络详情。提供纸质版和电子版。"
              },
              {
                "title": "会员证书",
                "description": "会员在申请获批后将获发国际认可的会员证书。证书将在年度会员盛典上颁发。"
              },
              {
                "title": "持续专业发展",
                "description": "优先参与由调解和 ADR 领域杰出专家主持的独家研讨会及专业发展课程（提供英文和阿拉伯语）。"
              }
            ]
          },
          "membership_journey": {
            "title": "会员发展历程",
            "subtitle": "成为 PMA 尊贵会员的简明流程。",
            "steps": [
              {
                "num": "1",
                "title": "提交会员申请表",
                "desc": "填写在线申请表。"
              },
              {
                "num": "2",
                "title": "资料审核",
                "desc": "我们的团队将评估您的申请。"
              },
              {
                "num": "3",
                "title": "会员入会批准",
                "desc": "您的申请获得批准后，您将收到通知。"
              },
              {
                "num": "4",
                "title": "欢迎加入 PMA",
                "desc": "获取您的会员证书并正式加入我们的专业社交网络。"
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "会员申请表",
              "desc": "请提供准确的信息。所有带有 * 标记的字段均为必填项。"
            },
            "sections": {
              "personal_info": {
                "title": "个人基本信息",
                "fields": {
                  "full_name": { "label": "全名", "placeholder": "请输入您的全名" },
                  "father_name": { "label": "父亲姓名", "placeholder": "请输入父亲姓名" },
                  "qualification": { "label": "教育程度/学历", "placeholder": "请输入学历" },
                  "designation": { "label": "职称/职位", "placeholder": "请输入职位" },
                  "cnic": { "label": "身份证/CNIC 号码", "placeholder": "请输入身份证号码" },
                  "chamber_phone": { "label": "办公室/事务所电话", "placeholder": "请输入事务所电话" }
                }
              },
              "contact_info": {
                "title": "联系方式",
                "fields": {
                  "office_address": { "label": "办公地址", "placeholder": "请输入办公地址" },
                  "res_address": { "label": "住宅地址", "placeholder": "请输入住宅地址" },
                  "res_phone": { "label": "住宅电话", "placeholder": "请输入住宅电话" },
                  "email": { "label": "电子邮箱", "placeholder": "请输入邮箱地址" },
                  "upload": {
                    "label": "上传证明文件",
                    "text": "选择文件或拖拽文件至此",
                    "hint": "支持 PDF, JPG, PNG 格式 (最大 5MB)"
                  }
                }
              },
              "references": {
                "title": "专业推荐人/证明人",
                "fields": {
                  "proposer_name": { "label": "第一推荐人姓名", "placeholder": "请输入推荐人全名" },
                  "proposer_address": { "label": "第一推荐人住宅地址", "placeholder": "请输入地址" },
                  "proposer_phone": { "label": "第一推荐人电话", "placeholder": "请输入电话号码" },
                  "seconder_name": { "label": "第二推荐人姓名", "placeholder": "请输入推荐人全名" },
                  "seconder_address": { "label": "第二推荐人住宅地址", "placeholder": "请输入地址" },
                  "seconder_phone": { "label": "第二推荐人电话", "placeholder": "请输入电话号码" }
                }
              }
            },
            "declaration": "我特此声明，上述提供的信息均属实且准确无误。",
            "submit_btn": "提交申请",
            "sidebar": {
              "title_main": "成为",
              "title_accent": "积极变革的一分子",
              "desc": "加入 PMA，共同为构建对话、理解和和平解决争端的文化做出贡献。",
              "list": [
                "专业行业认可",
                "持续学习与发展",
                "人脉拓展与合作",
                "深远的行业贡献"
              ],
              "quote": "齐心协力，我们能通过调解创造一个更加和谐与公正的社会。",
              "author": "- PMA"
            }
          }
        }
      }
    },
    psh: {
      translation: {
        nav: {
          home: "کور",
          about: "د PMA په اړه",
          mediation: "غږولنه",
          services: "خدمات",
          training: "روزنه",
          leadership: "مشرتابه",
          resources: "سرچینې",
          events: "پیښې",
          contact: "زما سره اړیکه",
          membership: "غړی شئ"
        },
        hero: {
          title_part1: "د آرام حل ته لاره کول",
          title_part2: "د مکالمې، پوهاوي او احترام له لارې",
          description1: "موږ د غږولنې د فعالې، موثره، محرمانې او همکارانه بدیل لپاره تشویق کوو.",
          description2: "د منظم مکالمې او حرفه ورانه سهولت له لارې، موږ افرادو، کورنیو، کاروبارونو او ادارو کې د نزاعاتو حل کې مرسته کوو.",
          btn_consult: "د وړیا مشورې غوښتنه کړئ",
          btn_training: "روزنې برنامې وګورئ"
        },
        features: {
          confidential_title: "محرمانه او نجی",
          confidential_desc: "ستاسو مکالمې بشپړ امنیت سره ساتل کیږي.",
          faster_title: "چټک حل",
          faster_desc: "نزاعات د مياشتو پرځای د ورځو یا اونیو کې حل کړئ.",
          cost_title: "کم لګښت حل",
          cost_desc: "د مهالو قانوني فیسو او اوږدې عدالتي جگړو څخه ډډ شئ."
        },
        glance: {
          title: "PMA یوهلته",
          founded: "تاسیس 2013–14",
          founded_label: "د افغانستان/پاکستان لومړی غږولنې ټولنه",
          mediations: "2000+",
          mediations_label: "کامیاب غږولنې او سهولت کیسونه",
          mediators: "100+",
          mediators_label: "تصدیق شوي غږولنګران",
          training: "100+",
          training_label: "تسلیم شوې روزنې برنامې",
          impact: "ملي اغیز",
          impact_label: "ADR پوهاوي او پالیسي اصلاحات"
        },
        about: {
          years: "کالونه",
          stat_label: "د غږولنې درې کولو پروات",
          tab1_title: "د PMA په اړه",
          tab1_text: "PMA د غږولنې او متبادل نزاع حل (ADR) له لارې د آرام حل کو لاره کولو لپاره تاسیس شوي خپلواک ادارې دې.",
          tab2_title: "زموږ نظریه",
          tab2_text: "غږولنه د پاکستان کې د نزاع حل کې مشهور ترین او ویره وړ طریقه وساتل.",
          tab3_title: "زموږ مشن",
          tab3_mission1: "غږولنه د رسیدونکې او موثره نزاع حل میکانیزم لپاره پروات کول",
          tab3_mission2: "بین الاقوامي معیاراتو سره غږولنګرانو کو روزنه او پذیرفتول",
          tab3_mission3: "عدالتونو، حکومتي ادارو او شخصي سکتورونو سره همکاري",
          tab3_mission4: "د غږولنې فایدو په اړه د ټولنې میږ آگاهي لپاره پروات",
          tab4_title: "زموږ اغیز",
          tab4_text1: "PMA په کامیابۍ سره د قانون پوهانو، قاضیانو او متخصصینو د سوو کس کو روزنه کړې دې.",
          tab4_text2: "موږ د عدالت سره او متعلقه شخصیتونو سره کار کوو ترم غږولنه د پایداره نزاع حل سیسټم لپاره پیاوړې کړو.",
          info_phone_label: "د زموږ خدمات ته ضرورت دی؟",
          info_phone_val: "زنګ کړئ: +92 300 000 0000",
          info_hours_label: "کاري وخت",
          info_hours_val: "دوشنبه-جمعه (9 بجې تر 5 بجې)",
          info_email_label: "زما ته ای میل کړئ",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "منځګړیتوب څه شی دی؟",
          text1: "منځګړیتوب یو رضاکارانه، محرم او منظم بهیر دی چیرې چې یو بې طرفه منځګړی د شخړې ښکیلو اړخونو سره مرسته کوي ترڅو خبرې وکړي، یو د بل لید درک کړي او یو داسې حل ته ورسیږي چې دواړو ته د منلو وړ وي.",
          text2: "دا اړخونه ځواکمن کوي چې د پایلو په جوړولو کې برخه واخلي، اړیکې وساتي او وخت، لګښت او فشار کم کړي.",
          btn: "د منځګړیتوب پروسه وپېژنئ"
        },
        why_choose: {
          title: "ولې <span class='pma-about-heading-accent'>PMA</span> غوره کړئ؟",
          lead: "موږ د اخلاقي، اغېزمنو او پایداره ADR حلونو وړاندې کولو لپاره د سیمه ایز تفاهم سره نړیوال معیارونه یوځای کوو.",
          btn: "د PMA په اړه نور معلومات ترلاسه کړئ",
          features: {
            f1_title: "نړیوال معیارونه",
            f1_desc: "موږ په نړیواله کچه منل شوي د منځګړیتوب اصول او کړنې تعقیبوو.",
            f2_title: "تجربه لرونکي او تصدیق شوي منځګړي",
            f2_desc: "زموږ په پینل کې خورا روزل شوي او باوري مسلکي کسان شامل دي.",
            f3_title: "پټه او محرمه پروسه",
            f3_desc: "ستاسو محرمیت په هر پړاو کې زموږ لومړیتوب دی.",
            f4_title: "ګړندۍ او دوستانه پایلې",
            f4_desc: "موږ د شخړو په اغېزمنه او ګټوره توګه حل کولو کې مرسته کوو.",
            f5_title: "اقتصادي او کم مصرفه",
            f5_desc: "د ګرانو او اوږدو قضایي دعوو لپاره یو عملي او غوره بدیل."
          }
        },
        training: {
          title_part1: "التدريب المهني و",
          title_part2: "الاعتماد (Accreditation)",
          text: "توفر PMA برامج تدريب وتطوير مهني متوافقة مع المعايير الدولية في مجال الوساطة، ومصممة خصيصاً للمحامين، ومحترفي الشركات، وفرق الموارد البشرية، والمعلمين، والوسطاء الطموحين. تركز ورش العمل وبرامج الشهادات لدينا على مهارات حل النزاعات العملية، واستراتيجيات التفاوض، والتواصل، وأطر الحلول البديلة لتسوية النزاعات (ADR).",
          features: {
            feat1: "اعتماد IMI",
            feat2: "مدربون خبراء",
            feat3: "تعلم عملي",
            feat4: "معايير عالمية"
          },
          card_text: "تلبي برامجنا التدريبية المعايير الدولية وتمكن المحترفين من أن يصبحوا وسطاء فعالين وأخلاقيين ومؤهلين عالمياً.",
          btn_text: "استكشاف برامج التدريب"
        },
        services: {
          title: "زموږ اصلي خدمات",
          list: {
            s1: { title: "سوداګریز او کارپوریټ منځګړیتوب", desc: "د سوداګریزو شخړو اغیزمن حل." },
            s2: { title: "عدالتي منځګړیتوب", desc: "د محکمو پورې اړوند قضیو لپاره ملاتړ." },
            s3: { title: "خانوادګي او ټولنیز منځګړیتوب", desc: "د کورنیو شخړو سوله ایز حل." },
            s4: { title: "د کارځای شخړې", desc: "د کارځای د داخلي شخړو حل." },
            s5: { title: "IMI-تصدیق شوې روزنه", desc: "مسلکي روزنیز پروګرامونه." },
            s6: { title: "ورکشاپونه او پوهاوی", desc: "د ADR په اړه تعلیمي غونډې." },
            s7: { title: "اداراتي مشورتي خدمات", desc: "د ADR سیسټمونو په جوړولو کې مرسته." }
          }
        },
        leadership: {
          title: "زموږ د مشرتابه سره وپیژنئ",
          roles: { president: "رئیس", secretary: "عمومي سکرتر", vp_north: "مرستیال رئیس - شمال", ec_north: "اجرائيوي کمیټه - شمال" }
        },
        stats: {
          s1: { label: "ترسره شوي منځګړیتوبونه", unit: "+" },
          s2: { label: "کامیاب حل", unit: "%" },
          s3: { label: "100% خصوصي پروسه", value: "محرم" },
          s4: { label: "روزنه لیدلي منځګړي", value: "تصدیق شوي" }
        },
        partners: {
          title: "زموږ شریکان",
          p1: "سندھ عالي محکمه",
          p2: "حکومتي ادارې",
          p3: "نړیوال منځګړیتوب انسټیټیوټ"
        },
        cta: {
          title: "راځئ خبرې وکړو، ځکه موږ کولی شو.",
          subtitle: "ایا غواړئ خپلې شخړې په سوله ایزه توګه حل کړئ؟ یا غواړئ یو تصدیق شوی منځګړی شئ؟ نن له موږ سره اړیکه ونیسئ",
          btn1: "وړیا مشوره",
          btn2: "یو تصدیق شوی منځګړی شئ",
          link: "زموږ ټیم سره فوری چیټ وکړئ"
        },
        footer: {
          brand: {
            tagline: "د پاکستان په کچه د خبرو اترو، منځګړیتوب او متقابل تفاهم له لارې د سوله ایزو حلونو هڅول.",
            logo_alt: "د پاکستان منځګړو ټولنه"
          },
          quick_links: {
            title: "چټک لینکونه",
            items: [
              { label: "کور پاڼه", link: "index.html" },
              { label: "د PMA په اړه", link: "about.html" },
              { label: "منځګړیتوب", link: "mediation.html" },
              { label: "خدمتونه", link: "services.html" },
              { label: "روزنه", link: "training.html" },
              { label: "مشرتابه", link: "leadership.html" },
              { label: "سرچینې", link: "resources.html" },
              { label: "پیښې", link: "events.html" },
              { label: "اړیکه", link: "contact.html" }
            ]
          },
          services: {
            title: "زموږ خدمتونه",
            items: [
              "د منځګړیتوب خدمتونه",
              "د IMI لخوا تصدیق شوې روزنه",
              "د ADR ورکشاپونه او د پوهاوي غونډې",
              "اداراتي ADR مشورتي خدمتونه",
              "پالیسي او د منځګړیتوب ملاتړ"
            ]
          },
          contact: {
            title: "د اړیکې معلومات",
            hours: "د دوشنبې نه تر جمعې (د سهار 9 بجو نه د ماښام تر 5 بجو)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 د پاکستان منځګړو ټولنه (PMA). ټول حقوق خوندي دي.",
            legal: [
              { label: "عامې پوښتنې (FAQ's)", link: "faq.html" },
              { label: "د محرمیت تګلاره", link: "privacy-policy.html" },
              { label: "د شکایت او اپیل تګلاره", link: "complaint-policy.html" },
              { label: "شرایط او ضوابط", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "د PMA په اړه",
            eyebrow: "د PMA په اړه",
            title_part1: "د داسې کلتور رامنځته کول",
            title_part2: "چې بنسټ یې په خبرو اترو، حل لارو او دوه اړخیزه تفاهم وي",
            lead: "د پاکستان منځګړو ټولنه (PMA) ژمنه ده چې د مسلکي روزنې, اداري همکارۍ، او په نړیواله کچه منل شویو معیارونو له لارې په ټول پاکستان کې منځګړیتوب او د شخړو متبادل حل (ADR) ته وده ورکړي."
          },
          about: {
            hero_img_alt: "د PMA په اړه",
            hero_eyebrow: "د PMA په اړه",
            hero_title_part1: "د داسې کلتور رامنځته کول",
            hero_title_part2: "چې بنسټ یې په خبرو اترو، حل لارو او دوه اړخیزه تفاهم وي",
            hero_lead: "د پاکستان منځګړو ټولنه (PMA) ژمنه ده چې د مسلکي روزنې، اداري همکارۍ، اور په نړیواله کچه منل شویو معیارونو له لارې په ټول پاکستان کې منځګړیتوب او د شخړو متبادل حل (ADR) ته وده ورکړي.",
            badge_years: "کاله",
            badge_stat_label: "د منځګړیتوب د عالي معیارونو <br>وده",
            nav_tab1: "د PMA په اړه",
            nav_tab2: "زموږ لیدلوری",
            nav_tab3: "زموږ ماموریت",
            nav_tab4: "زموږ اغېز",
            tab1_title1: "د PMA",
            tab1_title2: "په اړه",
            tab1_text: "PMA په 2013 کې تاسیس شوې او د پاکستان حکومت سره راجستر ده، PMA هغه مسلکي اداره ده چې د انګلستان د اغېزمنو شخړو حل مرکز (CEDR) لخوا اجازه ورکړل شوې ترڅو په پاکستان کې د CEDR ماډل منځګړیتوب روزنه وړاندې کړي.<br><br>PMA د تایلینډ د منځګړیتوب مرکز (2018) سره د تفاهم یادښت لاسلیک کړی او د سارک په نورو هیوادونو کې له بنسټونو سره قوي اړیکې پالي.<br><br>زموږ ټولنه په نړیواله کچه منل شوي د CEDR لخوا روزل شوي ماسټر ټرینرانو او منځګړو څخه جوړه ده چې په بریالیتوب سره یې په سند، پنجاب او اسلام آباد کې د قاضیانو او وکیلانو لپاره ډیری روزنیز پروګرامونه ترسره کړي دي.",
            tab2_title1: "زموږ",
            tab2_title2: "لیدلوری",
            tab2_text: "په پاکستان کې د شخړو د حل د ترټولو مخکښې او باوري طریقې په توګه د منځګړیتوب رامنځته کول، د رغنده خبرو اترو، دوه اړخیزه تفاهم او سوله ایز ژوند کلتور ته وده ورکول.",
            tab3_title1: "زموږ",
            tab3_title2: "ماموریت",
            tab3_points: [
              "منځګړیتوب ته د شخړو د حل د یوې اسانه او اغېزمنې لارې په توګه وده ورکول",
              "د نړیوالو معیارونو سره سم د منځګړو روزنه او تصدیق کول",
              "د محکمو، دولتي بنسټونو او خصوصي سکټورونو سره همکاري کول",
              "په ټولنه کې د منځګړیتوب د ګټو په اړه پوهاوی رامنځته کول"
            ],
            tab4_title1: "زموږ",
            tab4_title2: "اغېز",
            tab4_text1: "PMA په بریالیتوب سره په سلګونو وکیلان، قاضیان او مسلکي کسان روزلي او په پاکستان کې یې له محکمو سره د تړلي منځګړیتوب نوښتونو په وده کې مهم رول لوبولی دی.",
            tab4_text2: "موږ د قضایه قوې او شریکانو سره نږدې کار کولو ته دوام ورکوو ترڅو منځګړیتوب د شخړو د حل د یو باثباته سیسټم په توګه پیاوړی کړو."
          },
          leadership: {
            title1: "مشرتابه",
            title2: "پیغامونه",
            president: {
              name: "آغا ظفر احمد",
              role1: "د پاکستان د سترې محکمې (سپريم کورټ) وکیل",
              role2: "مشر (ولسمشر)",
              role3: "د پاکستان منځګړو ټولنه",
              heading: "د مشر پيغام",
              quote: "منځګړیتوب یوازې یو مسلکي وسیله نه ده، بلکې د پرمختلونکي قانوني سیسټم لپاره یو اړتیا ده.",
              lead: "لکه څنګه چې قانوني او سوداګریز چاپیریال بدلیږي، د ګړندي، عادلانه او اغېزمن انصاف په یقیني کولو کې د ADR رول هیڅکله دومره مهم نه و. د مشر په توګه زما پام زموږ د لاسرسي پراخولو باندې دی، ترڅو منځګړیتوب زموږ د قانوني چاپیریال یو بنسټیز ډبره شي.",
              read_more: "بشپړ پيغام لوستل",
              sign_role: "د پاکستان د سترې محکمې وکیل<br>مشر، د پاکستان منځګړو ټولنه",
              popup: {
                p1: "د پاکستان منځګړو ټولنې (PMA) د مشر په توګه خدمت کول یو لوی ویاړ دی. لکه څنګه چې قانوني او سوداګریز چاپیریال بدلیږي، د شخړو د متبادل حل (ADR) رول د ګړندي، عادلانه او اغېزمن انصاف په یقیني کولو کې د هر وخت په پرتله خورا مهم شوی دی.",
                p2: "د دې ټولنې د یو بنسټ اېښودونکي غړي په توګه زما سفر د دې باور لخوا پرمخ وړل شوی چې منځګړیتوب یوازې یو مسلکي وسیله نه ده، بلکې د یو پرمختلونکي قانوني سیسټم لپاره یوه جدي اړتیا ده. کله چې موږ راتلونکي ته ګورو، زما ژمنه دا ده چې ډاډ ترلاسه کړم چې زموږ ټولنه یو ډیر خوځنده او ګډ پلیټ فارم شي، چې د دودیزو محکمو او د شخړو د حل د عصري لارو ترمنځ د پله رول ولوبوي.",
                p3: "زموږ د تاسیس راهیسې، PMA په ټول پاکستان کې د منځګړیتوب د عمل دودولو او تنظیم کولو ته ځانګړې پاملرنه کړې ده. موږ هڅه کوو چې د مسلکي چلند ترټولو لوړ معیارونه وساتو او په ټول هیواد کې د منځګړو لپاره یو ګډ غږ چمتو کړو. د مشر په توګه زما تمرکز زموږ د لاسرسي په پراخولو دی، ترڅو ډاډ ترلاسه شي چې منځګړیتوب زموږ د قانوني سیسټم یو بنسټیز برخه شي، چې د عدلیې او عامو خلکو لخوا د ټولنیز او اقتصادي همغږۍ د یوې حیاتي وسیلې په توګه وپیژندل شي.",
                commit_heading: "موږ ژمن یو چې:",
                commit_list: [
                  "<strong>د وړتیاوو لوړول او مسلکي پراختیا:</strong> د منځګړو لپاره د لوړ کیفیت روزنې او تصدیق کولو اسانتیا ته دوام ورکول ترڅو د نړیوالې کچې معیارونه رامنځته شي او زموږ د غړو مهارتونه په صنعت کې ترټولو مخکښ وساتل شي.",
                  "<strong>وکالت (Advocacy):</strong> د شریکانو او عدلیې سره یوځای کار کول ترڅو منځګړیتوب په اصلي قانوني چوکاټ کې مدغم شي.",
                  "<strong>نوښت (Innovation):</strong> د سوداګریزو، سمندري او کښتیو شخړو په مؤثره توګه حل کولو لپاره د عصري تخنیکونو او نړیوالو غوره لارو کارول.",
                  "<strong>قومي کنوانسیونونه:</strong> موږ به هڅه وکړو چې په ټول هیواد کې د تجربو شریکولو، د بریالیتوبونو نمانځلو او زموږ د ګډ غږ پیاوړي کولو لپاره منظمې غونډې تنظیم کړو.",
                  "<strong>غوره همغږي:</strong> موږ د ټولو غړو ترمنځ د اړیکو او بوختیا ښه کولو ته ژمن یو ترڅو ډاډ ترلاسه شي چې د هرچا نظر اوریدل کیږي او ارزښت ورکول کیږي.",
                  "<strong>د غړیتوب وده:</strong> موږ به نوي مسلکي کسانو ته په تودوخې سره ښه راغلاست ووایو ترڅو د پاکستان په قانوني او سوداګریزو ټولنو کې د منځګړیتوب لاسرسی او نفوذ پراخ کړو.",
                  "<strong>د منځګړو لپاره د اخلاقي چلند ضابطه (Code of Conduct):</strong> سربیره پردې، د دې دورې یو مهم لومړیتوب د پاکستان بار کونسل او ولایتي بار کونسلونو سره د همغږۍ لپاره د یوې نوې کمیټې رامنځته کول دي. دا نوښت به د منځګړو لپاره د یوې قوي اخلاقي ضابطې په رسمي کولو تمرکز وکړي، ترڅو ډاډ ترلاسه شي چې زموږ کړنې په لوړو اخلاقي او مسلکي معیارونو ولاړې وي."
                ],
                closing: "زه له تاسو ټولو څخه غوښتنه کوم چې پدې ماموریت کې له موږ سره یوځای شئ ترڅو منځګړیتوب عام کړو او په پاکستان کې د همغږۍ او مسلکي عالي والي کلتور ته وده ورکړو."
              }
            },
            founding_president: {
              name: "انور کاشف ممتاز",
              role1: "د پاکستان د سترې محکمې وکیل",
              role2: "تصدیق شوی منځګړی (Accredited Mediator)",
              heading: "د بنسټ اېښودونکي مشر پيغام",
              quote: "په ګډه، موږ کولی شو داسې کلتور رامنځته کړو چې هلته د نښتې پر ځای تفاهم برلاسی وي.",
              lead: "زموږ ماموریت زموږ په ګران هیواد کې د شخړو د حل لپاره منځګړیتوب ته د یوې اخلاقي، اغېزمنې او اسانې لارې په توګه وده ورکول دي.",
              read_more: "بشپړ پيغام لوستل",
              sign_role: "د سترې محکمې وکیل<br>تصدیق شوی منځګړی",
              popup: {
                p1: "نن د پاکستان منځګړو ټولنې د بنسټ اېښودونکي مشر په توګه، زه ډیر خوښ یم چې د داسې یو پلیټ فارم د ودې شاهد یم چې د خبرو اترو او د شخړو سوله ایز حل ته وقف شوی دی. زموږ ماموریت زموږ په ګران هیواد کې د شخړو د حل لپاره د یوې اخلاقي او اسانې لارې په توګه د منځګړیتوب رامنځته کول دي. موږ د لوړو مسلکي معیارونو ساتلو او د شخړو د متبادل حل په لارو چارو د باور رامنځته کولو ته ژمن یو.",
                p2: "د همکارۍ، روزنې او دوامداره زده کړې له لارې، موږ موخه لرو چې په ټول هیواد کې د منځګړو وړتیاوې پیاوړې کړو.",
                p3: "زه ټول شریکان هڅوم چې منځګړیتوب د محکمو د ملاتړ او د عدالت او همغږۍ په لور د یوې رغندې لارې په توګه غوره کړي.",
                closing: "په ګډه، موږ کولی شو داسې کلتور رامنځته کړو چې هلته د نښتې پر ځای تفاهم برلاسی وي."
              }
            },
            stats: {
              s1_title: "په سلګونو روزل شوي",
              s1_text: "په ټول پاکستان کې وکیلان، قاضیان او مسلکي کسان روزل شوي دي.",
              s2_title: "له محکمو سره تړلی منځګړیتوب",
              s2_text: "په ټول هیواد کې د منځګړیتوب نوښتونو ته وده ورکول او پیاوړي کول.",
              s3_title: "قوي همکاري",
              s3_text: "د شخړو د حل د یو باثباته سیسټم لپاره د عدلیې او شریکانو سره نږدې کار کول."
            }
          }
        }, "mediation-page": {
          hero: {
            img_alt: "د منځګړیتوب د مشورې خونه",
            eyebrow: "منځګړیتوب (Mediation)",
            title_part1: "د شخړو حل لاره لټول",
            title_part2: "د خبرو اترو او دوه اړخیزه تفاهم له لارې",
            lead: "منځګړیتوب یو داوطلبانه، پټ او منظم بهیر دی چیرې چې یو بې طرفه منځګړی د ښکیلو غاړو سره مرسته کوي ترڅو دوه اړخیزه د منلو وړ او باثباته حل لارې ته ورسیږي."
          },
          mediation: {
            title1: "منځګړیتوب",
            title2: "څه شی دی؟",
            text1: "منځګړیتوب یو داوطلبانه، پټ او منظم بهیر دی چې پکې یو بې طرفه او ناپیيلې دریمه ډله — یعنې منځګړی (Mediator) — د شخړې د ښکیلو غاړو ترمنځ خبرې اترې اسانه کوي ترڅو هغوی وکولی شي د دوه اړخیزه د منلو وړ او باثباته حل لارې ته ورسیږي.",
            text2: "د محکمو د اوږدو جنجالونو برعکس، منځګړیتوب په ګډه همکارۍ، خپلواکې پرېکړې، او د ستونزو په تعميري حل ټینګار کوي. دا ښکيلو غاړو ته دا وړتیا ورکوي چې د خپلمنځي اړیکو د ساتلو ترڅنګ، په ګړندۍ او خورا لږ لګښت سره پایلې ترلاسه کړي.",
            img_alt: "منځګړیتوب څه شی دی"
          }, whyChoose: {
            heading_part1: "د PMA سره",
            heading_part2: "منځګړیتوب",
            heading_part3: "ولې غوره کړئ؟",
            cards: {
              card1: {
                title: "ګړندی او لږ لګښت لرونکی",
                desc: "د کلونو پر ځای په څو اونیو کې شخړې حل کړئ."
              },
              card2: {
                title: "پټ او محرم",
                desc: "بې له کوم عامه ریکارډ څخه یو شخصي او خوندي بهیر."
              },
              card3: {
                title: "د اړیکو ساتل",
                desc: "په دوه اړخیزه تفاهم او د دواړو خواوو په ګټه (win-win) حل لارو تمرکز."
              },
              card4: {
                title: "انعطاف منونکی او ګډ کار",
                desc: "ښکیلې غاړې په پایلو او پرېکړو بشپړ کنټرول لري."
              },
              card5: {
                title: "د IMI لخوا تایید شوي معیارونه",
                desc: "د منځګړو لپاره په نړیواله کچه منل شوي اعتبارپاڼې."
              }
            }
          },
          banner: {
            text: "PMA د منځګړیتوب د اعتبار، مسلکي روزنې، او وکالت لپاره د پاکستان <strong>لومړنۍ او تر ټولو پخوانۍ</strong> ځانګړې اداره ده — چې په <strong>2013–2014 کې تاسیس شوې</strong> او په کراچۍ کې موقعیت لري."
          },
          how_it_works: {
            title_part1: "منځګړیتوب څنګه",
            title_part2: "کار کوي؟",
            img_alt: "د منځګړیتوب پروسه",
            steps: {
              step1: {
                num: "۱",
                title: "خپله غوښتنه وسپارئ",
                desc: "تاسو د خپلې شخړې د جزیاتو شریکولو لپاره د PMA سره اړیکه ونیسئ."
              },
              step2: {
                num: "۲",
                title: "د قضیې لومړنۍ ارزونه",
                desc: "موږ موضوع ارزوو او د منځګړیتوب لپاره د هغې وړتیا ټاکو."
              },
              step3: {
                num: "۳",
                title: "د منځګړي (Mediator) ټاکل",
                desc: "ستاسو قضیې ته یو بې طرفه او وړ منځګړی ټاکل کیږي."
              },
              step4: {
                num: "۴",
                title: "تنظیم شوي ناستې (Sessions)",
                desc: "منځګړی د حل لارو موندلو لپاره د جوړښت شوي او ګټور ډیالوګ زمینه برابروي."
              },
              step5: {
                num: "۵",
                title: "تصفیه او هوکړه لیک",
                desc: "ښکیلې غاړې دوه اړخیزې د منلو وړ پایلې ته رسیږي او هوکړه لیک رسمي کوي."
              }
            }
          },
          who_we_serve: {
            title_part1: "موږ چا ته",
            title_part2: "خدمت کوو",
            cards: {
              card1: {
                title: "افراد او کورنۍ",
                desc: "د شخصي او مدني شخړو په هواري کې د افرادو او کورنیو سره مرسته کول."
              },
              card2: {
                title: "سوداګرۍ او کارپوریشنونه",
                desc: "د سوداګریزو او کار ځای د شخړو په حل کې د سوداګریزو ادارو ملاتړ کول."
              },
              card3: {
                title: "دولتي ادارې",
                desc: "د عامه سکتور د شخړو په حل کې د دولتي څانګو سره مرسته کول."
              },
              card4: {
                title: "این جی اوز او د ټولنې تنظیمونه",
                desc: "د ټولنیزو او عامه کچې سازمانونو لپاره د شخړو حل کول اسانول."
              },
              card5: {
                title: "د قانون شرکتونه او حقوقي متخصصین",
                desc: "د اغېزمنو ADR حل لارو لپاره د حقوقي متخصصینو سره ملګرتیا کول."
              }
            }
          },
          cta: {
            title_part1: "راځئ چې شخړې حل کړو",
            title_part2: "په سوله ییزه توګه.",
            subtitle: "منځګړیتوب تفاهم رامنځته کوي. تفاهم حل لارې لټوي. نن ورځ د PMA سره اړیکه ونیسئ ترڅو پوه شئ چې منځګړیتوب څنګه ستاسو سره مرسته کولی شي.",
            btn_text: "نن ورځ له موږ سره اړیکه ونیسئ"
          }
        },
        "services-page": {
          hero: {
            img_alt: "د خدماتو هیرو انځور",
            eyebrow: "زموږ خدمات",
            title_part1: "مسلکي منځګړیتوب او",
            title_part2: "د ADR خدمات",
            lead: "PMA د منځګړیتوب، روزنې، او مشورتي خدماتو یو جامع لړۍ وړاندې کوي ترڅو افرادو، سازمانونو او ادارو سره د شخړو په اغېزمنه توګه حل کولو او د ډیالوګ کلتور رامنځته کولو کې مرسته وکړي."
          },
          work_with: {
            title_part1: "موږ له چا سره",
            title_part2: "کار",
            title_part3: "کوو",
            items: {
              item1: "د قانون شرکتونه او حقوقي متخصصین",
              item2: "کارپوریشنونه او سوداګرۍ",
              item3: "دولتي ادارات",
              item4: "این جي اوز او د ټولنې سازمانونه",
              item5: "تعليمي مؤسسې",
              item6: "قضايه او عامه سکتور"
            }
          },
          services_cta: {
            title_part1: "راشئ چې په ګډه د شخړو د حل غوره",
            title_part2: "سیسټمونه جوړ کړو.",
            subtitle: "ستاسو د اړتیاوو سره سم د منځګړیتوب خدماتو، مسلکي روزنې، او مشورتي حلونو لپاره د PMA سره ملګرتیا وکړئ.",
            btn_text: "اړيکه ونیسئ"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "د اړيکې پاڼې هیرو انځور",
            eyebrow: "له موږ سره اړيکه ونیسئ",
            title_part1: "موږ دلته ستاسو د مرستې",
            title_part2: "لپاره یو.",
            lead: "که تاسو کومه پوښتنه لرئ، لارښوونې ته اړتیا لرئ، یا غواړئ همکاري وکړئ، زموږ ټیم ستاسو مرستې ته چمتو دی. له موږ سره اړیکه ونیسئ او موږ به په نږدې وخت کې تاسو ته ځواب درکړو.",
            features: {
              f1_title: "بشپړ محرمیت",
              f1_desc: "ستاسو معلومات تل خوندي ساتل کیږي",
              f2_title: "فوري ځواب",
              f2_desc: "موږ معمولاً په 24 ساعتونو کې ځواب ورکوو",
              f3_title: "مسلکي ټیم",
              f3_desc: "د منځګړیتوب د تجربه لرونکو کارپوهانو ټیم"
            }
          },
          "contact_section": {
            "info_col": {
              "title": "له موږ سره اړيکه ونیسئ",
              "lead": "موږ دلته ستاسو د پوښتنو ځوابولو او ستاسو د منځګړیتوب په سفر کې د اړتیا وړ ملاتړ چمتو کولو لپاره یو.",
              "labels": {
                "address": "د دفتر پته",
                "email": "برېښنالیک",
                "phone": "تلیفون",
                "whatsapp": "واټساپ",
                "hours": "د کار ساعتونه"
              },
              "values": {
                "address_text": "253، P.E.C.H.S.، بلاک-6، شاهراه فیصل، کراچۍ 75400، پاکستان",
                "hours_text": "د دوشنبې څخه تر جمعې پورې، د سهار 9:00 بجو څخه تر ماښام 5:00 بجو پورې (د پاکستان وخت)"
              }
            },
            "form_col": {
              "title": "موږ ته یو پیغام واستوئ",
              "lead": "ځینې جزیات شریک کړئ او زموږ ټیم به ژر تر ژره له تاسو سره اړیکه ونیسي.",
              "labels": {
                "name": "بشپړ نوم",
                "email": "د برېښنالیک پته",
                "phone": "د تلیفون شمیره",
                "inquiry": "د پوښتنې ډول",
                "subject": "موضوع",
                "message": "پیغام",
                "consent": "ټولې خبرې اترې په بشپړ ډول محرم دي او ستاسو معلومات خوندي دي."
              },
              "placeholders": {
                "name": "ستاسو نوم",
                "email": "ستاسو برېښنالیک",
                "phone": "ستاسو تلیفون",
                "subject": "ستاسو د پیغام موضوع",
                "message": "موږ څنګه کولای شو ستاسو مرسته وکړو؟"
              },
              "options": {
                "default": "یو اختیار غوره کړئ",
                "general": "عمومي پوښتنې",
                "mediation": "د منځګړیتوب خدمات",
                "training": "روزنه او تصدیق",
                "membership": "د غړیتوب معلومات",
                "advisory": "د اداراتي ADR مشورتي خدمتونه",
                "workshops": "ورکشاپونه او د پوهاوي ناستې",
                "event": "په پیښو کې ګډون",
                "partnership": "ملګرتیا او همکاري",
                "media": "د رسنیو او مطبوعاتو پوښتنې",
                "consultation": "قانوني / د پالیسۍ مشوره",
                "feedback": "شکایت یا نظر",
                "volunteer": "د رضاکارۍ فرصتونه",
                "speaker": "د وینا کونکي / ښوونکي غوښتنه",
                "corporate": "د کارپوریټ منځګړیتوب ملاتړ",
                "community": "د ټولنیز منځګړیتوب ملاتړ",
                "support": "د ویب پاڼې تخنیکي ملاتړ"
              },
              "btn_text": "پیغام واستوئ",
              "success_msg": "ستاسو پیغام په بریالیتوب سره واستول شو. موږ به په 24 ساعتونو کې تاسو سره اړیکه ونیسو.",
              "error_msg": "بخښنه غواړو، ستاسو د پیغام په لیږلو کې تېروتنه رامنځته شوه. مهرباني وکړئ بیا هڅه وکړئ.",
              "note": "نه قانوني پروسه، نه محکمه. یوازې سوله ایز حل. موږ معمولاً په 24 ساعتونو کې ځواب ورکوو."
            }
          },
          "map_section": {
            "title": "زموږ دفتر ته تشریف راوړئ",
            "lead": "موږ په کراچۍ کې زموږ دفتر ته ستاسو د راتګ په تودوخې سره هرکلی کوو.",
            "iframe_title": "د پی ایم اې د دفتر ځای — 253، P.E.C.H.S.، بلاک-6، کراچۍ"
          }
        },
        "faq_page": {
          "hero": {
            "img_alt": "د مکررو پوښتنو د پاڼې هیرو انځور",
            "title": "عامې پوښتنې",
            "lead": "د منځګړیتوب او زموږ د خدماتو په اړه د خورا عامو پوښتنو ځوابونه ومومئ."
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "د منځګړیتوب (MEDIATION) معیاري شق څه شی دی؟",
                "answer": "هر هغه او ټولې شخړې، اختلافات یا پوښتنې چې د دې تړون د خواوو ترمنځ رامنځته کیږي، باید لومړی د دواړو خواوو لخوا د دوه اړخیزو خبرو اترو له لارې په دوستانه ډول حل شي. که چیرې شخړې، اختلافات یا پوښتنې د یوې خوا لخوا د دوستانه حل لپاره د بلې خوا د غوښتنې ترلاسه کولو وروسته په دېرش (30) ورځو کې د لیکونو یا دوه اړخیزو بحثونو له لارې په دوستانه یا د قناعت وړ ډول حل نشي، نو دا به د PMA د منل شویو منځګړو یوې ډلې (پینل) ته راجع کیږي. د منځګړیتوب چارې به د منځګړیتوب د نړیوالو منل شویو مقرراتو سره سم پرمخ وړل کیږي."
              },
              "q2": {
                "question": "د وخت او لګښت یو متبادل – منځګړیتوب",
                "answer": "منځګړیتوب د اوږدو قانوني پړاوونو په پرتله یو ګړندی، ارزانه او محرم بدیل وړاندې کوي. دا د مسلکي او شخصي اړیکو ساتلو په ترڅ کې د خواوو سره په دوستانه ډول د شخړو په حل کې مرسته کوي."
              },
              "q3": {
                "question": "منځګړیتوب (MEDIATION) څه شی دی؟",
                "answer": "منځګړیتوب یوه داوطلبانه او محرمه پروسه ده چې په کې یو بې طرفه دریم غړی د شخړې ښکیل اړخونو سره د دوه اړخیزه د منلو وړ تړون په ترلاسه کولو کې مرسته کوي."
              },
              "q4": {
                "question": "د منځګړیتوب لپاره څنګه هڅه وکړو؟",
                "answer": "تاسو کولی شئ د منځګړیتوب خدماتو پیل کولو لپاره زموږ د ویب پاڼې یا دفتر له لارې له PMA سره اړیکه ونیسئ. زموږ ټیم به په دې پروسه کې ستاسو لارښوونه وکړي او تاسو به د باوري منځګړو سره وصل کړي."
              },
              "q5": {
                "question": "د منځګړیتوب ګټې",
                "benefits_list": {
                  "b1": "د شخړو ګړندی حل",
                  "b2": "کم قانوني لګښتونه",
                  "b3": "محرمې کاروایۍ",
                  "b4": "انعطاف منونکي حلونه",
                  "b5": "د خواوو ترمنځ د اړیکو ښه والی"
                }
              },
              "q6": {
                "question": "د منځګړیتوب ناسته (سیشن) به کله ترسره کیږي؟",
                "answer": "د منځګړیتوب ناسته د دواړو خواوو او منځګړي د شتون (وخت) پراساس مهالویش کیږي. PMA دا پروسه همغږي کوي ترڅو اسانتیا او موثریت یقیني کړي."
              },
              "q7": {
                "question": "په منځګړیتوب کې څه پیښیږي؟",
                "answer": "د منځګړیتوب پرمهال، دواړه خواوې خپلې اندیښنې په یو منظم چاپیریال کې د منځګړي په شتون کې مطرح کوي، کوم چې د حل لارو او ګډو ټکو په موندلو کې مرسته کوي."
              },
              "q8": {
                "question": "څه پیښیږي که چیرې هیڅ هوکړه لیک لاسلیک نشي؟",
                "answer": "که چیرې منځګړیتوب د هوکړې لامل نشي، دواړه خواوې آزادې دي چې د دوی لپاره شتون لرونکي نور قانوني انتخابونه یا د شخړې د حل لارې تعقیب کړي."
              },
              "q9": {
                "question": "د منځګړیتوب په ناسته کې څوک ګډون کولی شي؟",
                "answer": "یوازې ښکیلې غاړې، د دوی باصلاحیته استازي، قانوني مشاورین (که اجازه وي) او منځګړی کولی شي د منځګړیتوب په ناسته کې ګډون وکړي."
              },
              "q10": {
                "question": "دا به څومره لګښت ولري؟",
                "answer": "د منځګړیتوب لګښت د شخړې په نوعیت، پیچلتیا او موده پورې اړه لري. PMA د منځګړیتوب پروسې پیل کیدو دمخه د فیس په اړه بشپړ معلومات چمتو کوي."
              }
            },
            "contact_box": {
              "title": "لا هم پوښتنې لرئ؟",
              "lead": "موږ دلته ستاسو مرستې ته چمتو یو. له موږ سره اړیکه ونیسئ او زموږ ټیم به په خوښۍ سره ستاسو لارښوونه وکړي.",
              "btn_text": "له موږ سره اړیکه ونیسئ"
            }
          }
        },
        "training-page": {
          "hero": {
            "hero_img_alt": "د تربیت د پاڼې هیرو انځور",
            "eyebrow": "مسلکي روزنه",
            "title_part1": "د نړیوالې کچې منل شوې روزنې له لارې",
            "title_part2": "د پاکستان د راتلونکو منځګړو چمتو کول",
            "lead": "خپل مهارتونه پیاوړي کړئ. خپل مسلکي عمل لوړ کړئ. په ټولنه کې خبرو اترو، تفاهم او سوله ایز حل ته وده ورکړئ.",
            "banner": {
              "logo_alt": "د منځګړیتوب نړیوال انسټیټیوټ",
              "title": "د IMI څخه تصدیق شوی د منځګړیتوب روزنیز پروګرام",
              "tagline": "په نړیواله کچه منل شوی. په نړیواله کچه د درناوي وړ.",
              "desc": "PMA د منځګړیتوب نړیوال انسټیټیوټ (IMI) سره په رسمي ډول راجستر شوی د روزنې چمتو کونکی دی. زموږ د IMI څخه تصدیق شوی د منځګړیتوب روزنیز پروګرام د مسلکي منځګړو د روزنې لپاره ترټولو لوړ نړیوال معیارونه پوره کوي.",
              "link_text": "د لا زیاتو معلوماتو لپاره مهرباني وکړئ په لینک کلیک وکړئ"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "زموږ",
              "title_part2": "د روزنې",
              "title_part3": "پروګرامونه"
            },
            "programs": {
              "accredited_course": {
                "badge": "منل شوی (Accredited) کورس",
                "title": "د منځګړیتوب د مهارتونو منل شوی کورس",
                "desc_p1": "دا کورس د هغو کسانو لپاره دی چې د منځګړیتوب د مهارتونو سره په بلدتیا کې لیوالتیا لري. یو ګډونوال به د دې پروسې څخه بشپړ باخبره شي.",
                "desc_p2": "ټول کورسونه د عملي تمرینونو او رول پلي (کردار نګاري) له لارې ترسره کیږي.",
                "metrics": {
                  "total_hours": "ټول ساعتونه",
                  "days": "ورځې (له سې شنبې تر شنبې)",
                  "daily_hours": "ورځني ساعتونه",
                  "cert_status": "سند",
                  "cert_sub": "منل شوی"
                },
                "outcomes": {
                  "headline": "د کورس په پای کې ګډونوال باید وکولی شي چې:",
                  "list": {
                    "item1": "په منځګړیتوب کې مهارت ترلاسه کړي",
                    "item2": "د منځګړیتوب غوره لارې چارې زده کړي",
                    "item3": "د منځګړیتوب په اړه د پاکستان قوانین زده کړي",
                    "item4": "د خبرو اترو (مذاکراتو) مهارتونه زده کړي",
                    "item5": "تصدیق شوی منځګړی شي"
                  }
                },
                "btn_text": "د کورس جزیات وګورئ"
              },
              "introductory_course": {
                "badge": "غیر منل شوی کورس",
                "title": "د منځګړیتوب د مهارتونو تعارفي کورس",
                "desc_p1": "دا کورس د هغو کسانو لپاره دی چې د منځګړیتوب د مهارتونو د لومړني پوهاوي ترلاسه کولو کې لیوالتیا لرې. دا یو خورا لومړنی کورس دی.",
                "desc_p2": "په دې کې هیڅ تمرینونه یا رول پلي شتون نلري.",
                "metrics": {
                  "total_hours": "ټول ساعتونه",
                  "days": "ورځې (نږدې وخت کې به اعلان شي)",
                  "daily_hours": "ورځني ساعتونه",
                  "cert_status": "غیر منل شوی"
                },
                "btn_text": "د کورس جزیات وګورئ"
              },
              "basic_info_course": {
                "badge": "غیر منل شوی کورس",
                "title": "د منځګړیتوب د مهارتونو په اړه بنسټیز معلومات",
                "desc_p1": "دا کورس د هغو کسانو لپاره دی چې د منځګړیتوب د مهارتونو د لومړني پوهاوي ترلاسه کولو کې لیوالتیا لرې. دا یو خورا لومړنی کورس دی.",
                "desc_p2": "په دې کې هیڅ تمرینونه یا رول پلي شتون نلري.",
                "metrics": {
                  "total_hours": "ټول ساعتونه",
                  "days": "ورځ (۱ ورځ)",
                  "daily_hours": "ورځني ساعتونه",
                  "cert_status": "غیر منل شوی"
                },
                "btn_text": "د کورس جزیات وګورئ"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "څوک",
              "title_part2": "باید",
              "title_part3": "ګډون وکړي؟",
              "subtitle": "دا روزنه د هغو مسلکي کسانو لپاره ډیزاین شوې چې غواړي مثبت بدلون رامنځته کړي"
            },
            "cards": {
              "c1": {
                "title": "وکیلان او د قانون د برخې مسلکي کسان",
                "desc": "د شخړو د حل کولو مهارتونه مو پیاوړي کړئ او خپل مسلکي عمل ته پراختیا ورکړئ."
              },
              "c2": {
                "title": "قاضیان او د محکمې چارواکي",
                "desc": "د ADR په اړه خپل پوهاوی پیاوړی کړئ او د قضیو د اغیزمن مدیریت ملاتړ وکړئ."
              },
              "c3": {
                "title": "د کارپوریټ (شرکتونو) مسلکي کسان",
                "desc": "په کاري ځای کې د خبرو اترو، اړیکو او د شخړو مدیریت ته وده ورکړئ."
              },
              "c4": {
                "title": "د HR او اداري برخې مسلکي کسان",
                "desc": "د افرادو په محور د شخړو حل او په کاري ځای کې همغږي رامنځته کړئ."
              },
              "c5": {
                "title": "این‌جیوګانې (NGOs) او د ټولنې مشران",
                "desc": "د ټولنې شخړې حل کړئ او ټولنیز پیوستون او شمولیت ته وده ورکړئ."
              },
              "c6": {
                "title": "زدکونکي او د ADR مینه وال",
                "desc": "په منځګړیتوب کې خپل سفر پیل کړئ او په ADR کې یو قوي بنسټ رامنځته کړئ."
              },
              "c7": {
                "title": "دولتي چارواکي",
                "desc": "د عامه سکتور په شخړو او د پالیسۍ په پلي کولو کې د منځګړیتوب مهارتونه وکاروئ."
              },
              "c8": {
                "title": "هر هغه څوک چې له ADR او منځګړیتوب سره مینه لري",
                "desc": "د هغو ټولو کسانو لپاره خلاص دی چې د سوله ایزو خبرو اترو او شخړو حل کولو سره لیوالتیا لري."
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "مختلف شالیدونه، یو هدف",
            "title": "مختلف شالیدونه (پس منظر). یو هدف: سوله ایز حل.",
            "desc": "زموږ روزنه د بیلا بیلو برخو مسلکي کسان یو ځای کوي چې په خبرو اترو، تفاهم او د غوره ټولنو په جوړولو باور لري.",
            "btn_text": "کورس لپاره نوم لیکنه وکړئ"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "زموږ له پروګرام سره یو ځای شئ",
              "title": "د منځګړیتوب د روزنې په پروګرامونو کې ګډون وکړئ",
              "tagline": "د غوره والي په لور لومړی ګام پورته کړئ",
              "desc": "نن ورځ نوم لیکنه وکړئ او د نړیوال کچه منل شوي روزنیز پروګرامونو برخه شئ چې ستاسو د مهارتونو لوړولو، ستاسو د مسلک پیاوړتیا او په ټولنه کې د سوله ایز حل د ودې لپاره ډیزاین شوي.",
              "img_alt": "د زین مراقبې ډبرې",
              "seat_badge": {
                "title": "خپله څوکۍ خوندي کړئ",
                "desc_part1": "محدودې څوکۍ",
                "desc_part2": "په هره دوره (batch) کې شتون لري."
              }
            },
            "form_panel": {
              "header_title": "د نوم لیکنې جزیات",
              "labels": {
                "name": "بشپړ نوم",
                "email": "د بریښنالیک پته",
                "phone": "د تلیفون شمیره",
                "background": "مسلکي شالید",
                "city": "ښار",
                "program": "روزنیز پروګرام غوره کړئ",
                "additional_info": "اضافي معلومات (اختیاري)"
              },
              "placeholders": {
                "name": "خپل بشپړ نوم دننه کړئ",
                "email": "خپل بریښنالیک پته دننه کړئ",
                "phone": "خپل د تلیفون شمیره دننه کړئ",
                "background": "مثلا: وکیل، د HR مسلکي، زدکونکی",
                "city": "خپل ښار دننه کړئ",
                "program_default": "-- مهرباني وکړئ یو پروګرام غوره کړئ --",
                "additional_info": "هر هغه اضافي معلومات چې تاسو یې شریکول غواړئ"
              },
              "options": {
                "accredited": "د منځګړیتوب د مهارتونو منل شوی کورس",
                "introductory": "د منځګړیتوب د مهارتونو تعارفي کورس",
                "basic": "د منځګړیتوب د مهارتونو په اړه بنسټیز معلومات"
              },
              "btn_text": "د شمولیت لپاره غوښتنه وکړئ",
              "privacy_note": "ستاسو معلومات خوندي دي او یوازې د نوم لیکنې د موخو لپاره کارول کیږي.",
              "messages": {
                "success": "نوم لیکنه بریالۍ شوه! موږ به په ۲۴ ساعتونو کې له تاسو سره اړیکه ونیسو.",
                "error": "بښنه غواړو، ستاسو د نوم لیکنې په لیږلو کې ستونزه رامنځته شوه. مهرباني وکړئ بیا هڅه وکړئ."
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "د IMI لخوا منل شوی",
                "desc": "زموږ پروګرامونه د منځګړیتوب د نړیوال انسټیټیوټ (IMI) لخوا تایید شوي دي."
              },
              "b2": {
                "title": "ماهر روزونکي (Trainers)",
                "desc": "د تجربه لرونکو منځګړو او د دې برخې له مسلکي کسانو څخه زده کړه وکړئ."
              },
              "b3": {
                "title": "نړیوال معیارونه",
                "desc": "روزنه په نړیواله کچه د منځګړیتوب له منل شویو معیارونو سره برابره ده."
              },
              "b4": {
                "title": "مسلکي تصدیق (Certification)",
                "desc": "د کورس په بریالیتوب سره پای ته رسولو په صورت کې یو منل شوی سند ترلاسه کړئ."
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "منل شوی کورس",
              "title_part1": "د منځګړیتوب د مهارتونو",
              "title_part2": "منل شوی کورس",
              "desc": "دا کورس د هغو کسانو لپاره دی چې د منځګړیتوب د مهارتونو سره په بلدتیا کې لیوالتیا لري. یو ګډونوال به د دې پروسې څخه بشپړ باخبره شي. ټول کورسونه د عملي تمرینونو او رول پلي (کردار نګاري) له لارې ترسره کیږي.",
              "stats": {
                "type": { "label": "د کورس ډول", "value": "د اعتبار وړ سند" },
                "total_hours": { "label": "ټول ساعتونه", "value": "40" },
                "duration": { "label": "موده", "value": "۵ ورځې (یوه اونۍ)" },
                "daily_hours": { "label": "ورځني ساعتونه", "value": "۸" },
                "days": { "label": "د روزنې ورځې", "value": "له سې شنبې تر شنبې" },
                "time": { "label": "د روزنې وخت", "value": "د سهار له ۹ تر مازدیګر ۵ بجو" }
              }
            },
            "main_content": {
              "about": {
                "title": "د دې کورس په اړه",
                "desc": "دا هراړخیز پروګرام ګډونوال د منځګړیتوب په عملي مهارتونو، د مذاکراتو په تخنیکونو او د منځګړیتوب په اړه د پاکستان په قوانینو سمبالوي. د عملي زدکړې، تمرینونو او رول پلي کولو له لارې، ګډونوال به چمتو شي چې د ریښتیني ژوند شخړې په مؤثره او اخلاقي توګه حل کړي."
              },
              "outcomes": {
                "title": "تاسو به څه زده کړئ",
                "items": [
                  "په منځګړیتوب کې مهارت ترلاسه کول",
                  "د منځګړیتوب غوره لارې چارې زده کول",
                  "د منځګړیتوب په اړه د پاکستان قوانین زده کول",
                  "د خبرو اترو (مذاکراتو) مهارتونه زده کول",
                  "تصدیق شوی منځګړی کیدل",
                  "د اغیزمنو تصفیې تړونونو مسوده چمتو کول"
                ]
              },
              "columns": {
                "outline": {
                  "title": "د کورس خاکه (Outline)",
                  "items": [
                    "د شخړو د بدیل حل (ADR) لیدلوری",
                    "د منځګړیتوب پړاوونه او فیزونه",
                    "کلامي او غیر کلامي اړیکې (Communication)",
                    "د خبرو اترو سټایل (Negotiation Style)",
                    "د پوښتنو کولو تخنیکونه",
                    "د احتمالي هوکړې ساحه (ZOPA)",
                    "د ډیډ لاک (خنډ) ماتول",
                    "د تصفیې د تړون د مسودې چمتو کول",
                    "د منځګړیتوب لپاره مناسبې قضیې",
                    "ذاتي ارزونه (Self-assessment)",
                    "د معاملې او سوداګرۍ تخنیکونه"
                  ]
                },
                "structure": {
                  "title": "د کورس جوړښت",
                  "modules": [
                    { "badge": "ماډیول 01", "title": "د ADR بنسټیز معلومات" },
                    { "badge": "ماډیول 02", "title": "د منځګړیتوب پروسه او پړاوونه" },
                    { "badge": "ماډیول 03", "title": "اړیکې او پوښتنې کول" },
                    { "badge": "ماډیول 04", "title": "د مذاکراتو تخنیکونه" },
                    { "badge": "ماډیول 05", "title": "د ډیډ لاک (خنډ) حل کول" },
                    { "badge": "ماډیول 06", "title": "د تړون مسوده او پایله" },
                    { "badge": "ماډیول 07", "title": "ذاتي ارزونه او غوره تګلارې" }
                  ]
                },
                "methodology": {
                  "title": "د روزنې طریقه کار",
                  "items": [
                    "تجرباتي او عملي زدکړه",
                    "عملي تمرینونه",
                    "رول پلي او سیمولیشنز",
                    "ګروپي بحثونه (مباحثې)",
                    "کیس سټډیز (عملي قضیې)",
                    "انټرایکټیو (دوه اړخیزې) ناستې"
                  ]
                }
              },
              "certification": {
                "title": "د سند لاسته راوړنه",
                "desc": "ګډونوالو ته به په کورس کې د بریالۍ برخې اخیستنې وروسته د کورس د بشپړولو سند ورکړل شي. دا کورس اشخاص چمتو کوي چې په بیلا بیلو چاپیریالونو کې په اخلاقي، مسلکي او مؤثره توګه د منځګړیتوب مهارتونه پلي کړي."
              },
              "attendees": {
                "title": "څوک باید ګډون وکړي؟",
                "items": [
                  "وکیلان او د قانون د برخې مسلکي کسان",
                  "قاضیان او د محکمې چارواکي",
                  "د کارپوریټ (شرکتونو) مسلکي کسان",
                  "د HR او اداري برخې مسلکي کسان",
                  "این‌جیوګانې او د ټولنې مشران",
                  "زدکونکي او د ADR مینه وال"
                ]
              },
              "btn_text": "د دې پروګرام لپاره غوښتنه وکړئ"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "غیر منل شوی کورس",
              "title_part1": "د منځګړیتوب د مهارتونو",
              "title_part2": "تعارفي کورس",
              "desc": "دا کورس د هغو کسانو لپاره دی چې د منځګړیتوب د مهارتونو د لومړني پوهاوي ترلاسه کولو کې لیوالتیا لرې. دا یو خورا لومړنی کورس دی او غیر منل شوی دی.",
              "stats": {
                "type": { "label": "غیر منل شوی کورس", "value": "" },
                "total_hours": { "label": "ټول ساعتونه", "value": "16" },
                "duration": { "label": "موده", "value": "۲ کاري ورځې" },
                "daily_hours": { "label": "ورځني ساعتونه", "value": "۸" },
                "days": { "label": "د روزنې ورځې", "value": "هر ډول دوه ورځې (نږدې وخت کې به اعلان شي)" },
                "time": { "label": "د روزنې وخت", "value": "د سهار له ۹ تر مازدیګر ۵ بجو" }
              }
            },
            "main_content": {
              "about": {
                "title": "د دې کورس په اړه",
                "desc": "دا تعارفي کورس د منځګړیتوب د مهارتونو او د هغې د پروسې بنسټیز پوهاوی چمتو کوي. ګډونوال به د منځګړیتوب د پروسې څخه باخبره شي او پدې به پوه شي چې دا د هر چا لپاره څه راتلونکی لري. دا کورس په تیوري ولاړ دی او هیڅ عملي تمرینونه یا رول پلي نلري."
              },
              "outcomes": {
                "title": "تاسو به څه زده کړئ",
                "items": [
                  "د منځګړیتوب په بنسټونو پوهیدل",
                  "د منځګړیتوب کلیدي مفاهیم زده کول",
                  "پدې پوهیدل چې منځګړیتوب کله کارول کیدی شي",
                  "د منځګړیتوب پروسې په اړه پوهاوی ترلاسه کول",
                  "د پروسې یو باخبره کاروونکی کیدل"
                ]
              },
              "columns": {
                "outline": {
                  "title": "د کورس خاکه (Outline)",
                  "items": [
                    "د شخړو د بدیل حل (ADR) لیدلوری",
                    "د منځګړیتوب پړاوونه او فیزونه",
                    "کلامي او غیر کلامي اړیکې (Communication)",
                    "د خبرو اترو سټایل (Negotiation Style)",
                    "د پوښتنو کولو تخنیکونه",
                    "د احتمالي هوکړې ساحه (ZOPA)",
                    "د ډیډ لاک (خنډ) ماتول",
                    "د تصفیې د تړون د مسودې چمتو کول",
                    "د منځګړیتوب لپاره مناسبې قضیې",
                    "د معاملې او سوداګرۍ تخنیکونه"
                  ]
                },
                "info_table": {
                  "title": "د کورس معلومات",
                  "trainer": { "label": "روزونکی", "value": "وروسته به اعلان شي (TBA)" },
                  "daily_hours": { "label": "ورځني ساعتونه", "value": "اته (8)" },
                  "total_hours": { "label": "ټول ساعتونه", "value": "شپاړس (16)" },
                  "days": { "label": "د روزنې ورځې", "value": "هر ډول دوه ورځې (وروسته به اعلان شي)" },
                  "time": { "label": "د روزنې وخت", "value": "د سهار له ۹ تر مازدیګر ۵ بجو" },
                  "duration": { "label": "د کورس موده", "value": "دوه (2) کاري ورځې" },
                  "type": { "label": "د کورس ډول", "value": "غیر منل شوی کورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "څوک باید ګډون وکړي؟",
                  "items": [
                    "زدکونکي او نوي فارغ شوي ځوانان",
                    "د هرې برخې مسلکي کسان",
                    "د HR او اداري برخې مسلکي کسان",
                    "این‌جیوګانې او د ټولنې کارکونکي",
                    "هر هغه څوک چې له منځګړیتوب سره مینه لري"
                  ]
                },
                "note": {
                  "title": "مهم یادونه",
                  "desc": "دا یو بنسټیز کورس دی چې یوازې د پوهې او پوهاوي چمتو کولو لپاره ډیزاین شوی. په دې کورس کې هیڅ تمرینونه، رول پلي یا ذاتي ارزونه شتون نلري."
                }
              },
              "btn_text": "پدې کورس کې نوم لیکنه وکړئ"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "غیر منل شوی کورس",
              "title_part1": "د منځګړیتوب د مهارتونو",
              "title_part2": "په اړه بنسټیز معلومات",
              "desc": "دا تعارفي کورس د منځګړیتوب د مهارتونو او د هغوی د پلي کیدو په اړه د عمومي پوهاوي چمتو کولو لپاره ډیزاین شوی. دا یو خورا لومړنی کورس دی او غیر منل شوی دی.",
              "stats": {
                "type": { "label": "غیر منل شوی کورس", "value": "" },
                "total_hours": { "label": "ټول ساعتونه", "value": "8" },
                "duration": { "label": "موده", "value": "۱ ورځ" },
                "daily_hours": { "label": "ورځني ساعتونه", "value": "۸" },
                "days": { "label": "د روزنې ورځې", "value": "هر ډول یوه ورځ (وروسته به اعلان شي)" },
                "time": { "label": "د روزنې وخت", "value": "د سهار له ۹ تر مازدیګر ۵ بجو" }
              }
            },
            "main_content": {
              "about": {
                "title": "د دې کورس په اړه",
                "desc": "دا د بنسټیزو معلوماتو کورس د منځګړیتوب د مهارتونو، د منځګړیتوب پروسې، او د شخړو د حل کولو د کلیدي مفاهیمو په اړه د عمومي پوهاوي چمتو کولو لپاره ډیزاین شوی. ګډونوال به د عملي تمرینونو یا رول پلي کولو پرته، د منځګړیتوب د کار کولو طریقه په بنسټیزه توګه زده کړي."
              },
              "outcomes": {
                "title": "تاسو به څه زده کړئ",
                "items": [
                  "د منځګړیتوب په بنسټونو پوهیدل",
                  "د منځګړیتوب کلیدي مفاهیم زده کول",
                  "پدې پوهیدل چې منځګړیتوب کله کارول کیدی شي",
                  "د منځګړیتوب پروسې په اړه پوهاوی ترلاسه کول",
                  "د شخړو د حل کولو بنسټیز مفاهیم"
                ]
              },
              "columns": {
                "outline": {
                  "title": "د کورس خاکه (Outline)",
                  "items": [
                    "د شخړو د بدیل حل (ADR) لیدلوری",
                    "د منځګړیتوب پړاوونه او فیزونه",
                    "منځګړیتوب ته سریزه (پیژندنه)",
                    "د منځګړیتوب پروسې عمومي کتنه",
                    "په منځګړیتوب کې اړیکې (Communication)",
                    "پوښتنې او وضاحتونه",
                    "د ډیډ لاک (خنډ) پیژندل",
                    "د تړون بنسټونه او اصول"
                  ]
                },
                "info_table": {
                  "title": "د کورس معلومات",
                  "trainer": { "label": "روزونکی", "value": "وروسته به اعلان شي (TBA)" },
                  "daily_hours": { "label": "ورځني ساعتونه", "value": "اته (8)" },
                  "total_hours": { "label": "ټول ساعتونه", "value": "اته (8)" },
                  "days": { "label": "د روزنې ورځې", "value": "هر ډول یوه ورځ (وروسته به اعلان شي)" },
                  "time": { "label": "د روزنې وخت", "value": "د سهار له ۹ تر مازدیګر ۵ بجو" },
                  "duration": { "label": "د کورس موده", "value": "یوه (1) ورځ" },
                  "type": { "label": "د کورس ډول", "value": "غیر منل شوی کورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "څوک باید ګډون وکړي؟",
                  "items": [
                    "زدکونکي او نوي فارغ شوي ځوانان",
                    "د هرې برخې مسلکي کسان",
                    "د HR او اداري برخې مسلکي کسان",
                    "این‌جیوګانې او د ټولنې کارکونکي",
                    "هر هغه څوک چې له منځګړیتوب سره مینه لري"
                  ]
                },
                "note": {
                  "title": "مهم یادونه",
                  "desc": "دا یو لومړنی کورس دی چې یوازې د عمومي معلوماتو او پوهاوي چمتو کولو لپاره ډیزاین شوی. په دې کورس کې هیڅ تمرینونه، رول پلي یا ذاتي ارزونه شتون نلري."
                }
              },
              "btn_text": "پدې کورس کې نوم لیکنه وکړئ"
            }
          }
        },
        "leadership_page": {
          "hero": {
            "eyebrow": "مشرتابه (رهبري)",
            "title_main": "مشرتابه",
            "title_accent": "زموږ خلک، زموږ ځواک",
            "lead_text": "د هغو مخلصو او ژمنو مسلکي کسانو سره وپیژنئ چې په ټول پاکستان کې د خبرو اترو، تفاهم او سوله ایز حل د ودې لپاره د PMA د ماموریت مشري کوي."
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "اجرائيوي ټیم",
              "sub_committee": "فرعي کمیټه",
              "mediator": "منځګړي (وساطت کونکي)",
              "trainer": "روزونکي (ټرینران)",
              "former_president": "پخواني ولسمشران / مشران"
            },
            "search_placeholder": "د نوم یا تخصص له لارې لټون وکړئ..."
          },
          "members": {
            "member_1": {
              "name": "آغا ظفر احمد",
              "title": "مشر (صدر)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د آغا ظفر احمد پروفایل کتل"
            },
            "member_2": {
              "name": "صائمه امين خواجه",
              "title": "مرستیال مشر – شمال",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د صائمه امين خواجه پروفایل کتل"
            },
            "member_3": {
              "name": "اسفند يار علي خان",
              "title": "مرستیال مشر – شمال",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د اسفند يار علي خان پروفایل کتل"
            },
            "member_4": {
              "name": "سعید حبیب",
              "title": "مرستیال مشر – سویل (جنوب)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)"
              },
              "aria_label": "د سعید حبیب پروفایل کتل"
            },
            "member_5": {
              "name": "شبانه علي",
              "title": "مرستیال مشر – سویل (جنوب)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "pma_accredited": "د PMA لخوا منل شوی منځګړی"
              },
              "aria_label": "د شبانه علي پروفایل کتل"
            },
            "member_6": {
              "name": "وجيهه عليم",
              "title": "عمومي سکرتر (سیکرټري جنرل)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د وجيهه عليم پروفایل کتل"
            },
            "member_7": {
              "name": "سيد صمد الحق",
              "title": "مالي سکرتر",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)"
              },
              "aria_label": "د سيد صمد الحق پروفایل کتل"
            },
            "member_8": {
              "name": "طارق سعيد رانا",
              "title": "اجرائيوي کمیټه – شمال",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د طارق سعيد رانا پروفایل کتل"
            },
            "member_9": {
              "name": "ہما شاه",
              "title": "اجرائيوي کمیټه – شمال",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د ہما شاه پروفایل کتل"
            },
            "member_10": {
              "name": "امیمہ انور خان",
              "title": "اجرائيوي کمیټه – سویل (جنوب)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)"
              },
              "aria_label": "د امیمہ انور خان پروفایل کتل"
            },
            "member_11": {
              "name": "مستنصر ذاکر",
              "title": "اجرائيوي کمیټه – سویل (جنوب)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځګړی"
              },
              "aria_label": "د مستنصر ذاکر پروفایل کتل"
            },
            "member_12": {
              "name": "عدنان مفتی",
              "title": "اجرائيوي کمیټه – سویل (جنوب)",
              "badges": {
                "executive_team": "اجرائيوي ډله (ايګزيڪيوټو ټيم)",
                "mediator": "منځګړی (ثالث)",
                "cedr_accredited": "د CEDR لخوا منل شوی منځړی"
              },
              "aria_label": "د عدنان مفتی پروفایل کتل"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "مستنصر ذاکر",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "director_training": "د روزنې مشر (ډايريکټر ټريننګ)",
                "ex_president": "پخوانی مشر (سابق صدر)"
              },
              "aria_label": "د مستنصر ذاکر پروفایل کتل"
            },
            "trainer_2": {
              "name": "انور کاشف ممتاز",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "ex_president": "پخوانی مشر (سابق صدر)",
                "leadership_trainer": "د مشرتابه روزونکی (ليډرشپ ټرينر)"
              },
              "aria_label": "د انور کاشف ممتاز پروفایل کتل"
            },
            "trainer_3": {
              "name": "طارق سعید رانا",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "ex_president": "پخوانی مشر (سابق صدر)",
                "executive_committee_north": "اجرائيوي کمیټه – شمال"
              },
              "aria_label": "د طارق سعید رانا پروفایل کتل"
            },
            "trainer_4": {
              "name": "صائمه امين خواجه",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "executive_member": "اجرائيوي غړی",
                "vice_president_north": "مرستیال مشر – شمال"
              },
              "aria_label": "د صائمه امين خواجه پروفایل کتل"
            },
            "trainer_5": {
              "name": "ہما شاه",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "executive_committee_north": "اجرائيوي کمیټه – شمال",
                "training_committee": "د روزنې کمیټه"
              },
              "aria_label": "د ہما شاه پروفایل کتل"
            },
            "trainer_6": {
              "name": "عثمان جي راشد",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "barrister_at_law": "بېریسټر (قانون پوه)",
                "former_secretary_general": "پخوانی عمومي سکرتر – PMA"
              },
              "aria_label": "د عثمان جي راشد پروفایل کتل"
            },
            "trainer_7": {
              "name": "اسفند يار علي خان",
              "title": "ماسټر ټرینر",
              "badges": {
                "master_trainer": "ماسټر ټرینر",
                "executive_leadership": "اجرائيوي مشرتابه",
                "vice_president_north": "مرستیال مشر – شمال"
              },
              "aria_label": "د اسفند يار علي خان پروفایل کتل"
            }
          },
          "modal": {
    "about_label": "په اړه",
    "expertise_title": "تخصص / مهارت",
    "training_expertise_title": "د روزنې تخصص",
    "accreditations_title": "اعتبارنامې / اسناد",
    "education_title": "زده کړې",
    "affiliations_title": "مسلکي تړاوونه",
    "media_title": "میډیا او عامه ښکیلتیا",
    "coming_soon": "ډېر ژر",
    "profile_close_label": "پروفایل بند کړئ"
  },
  "profile_modal": {
"aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "مشر (صداقت)",
    "highlight": "\"د مشرتابه، وکالت او ADR د لارې ثالثي او د نړیوالو شخړو هوارولو کلتور ته وده ورکول.\"",
    "about": "ښاغلی آغا ظفر احمد د پاکستان میډیټرز ایسوسی ایشن (PMA) صدر او د پاکستان د سپریم کورټ یو وتلی وکیل دی چې د ۲۱ کالو څخه زیات د وکالت تجربه لري. هغه د سمندري قانون، تجارتي شخړو، نړیوالې سوداګرۍ او د شخړو متبادل حل (ADR) کې په خپله مهارت پېژندل شوی دی. د PMA د بنسټ اېښودونکي په توګه، هغه په پاکستان کې د دریمګړیتوب یا ثالثي د لارې د شخړو سوله ایز حل لپاره هڅې کوي.",
    "badges": ["اجرایوي ټیم", "ثالث (میډیټر)", "د CEDR لخوا منل شوی ثالث", "ماسټر ټرینر", "اجرایوي مشرتابه"],
    "expertise": ["تجارتي شخړې", "سمندري قانون (Maritime Law)", "د نړیوالې سوداګرۍ شخړې", "کارپوریټ ثالثي", "سول قضایاوې", "د شخړو متبادل حل (ADR)"],
    "experience": { "years": "۲۱+ کاله", "label": "د وکالت او د شخړو حل تجربه" },
    "accreditations": ["د CEDR لندن لخوا منل شوی ثالث", "د MICADR د پینل ثالث", "د PMA لخوا منل شوی ثالث", "په نړیواله کچه د ثالثي قانون ډیپلوما"],
    "education": ["په نړیواله کچه د ثالثي قانون ډیپلوما – د انګلستان او ویلز د قانون کالج"],
    "affiliations": ["د سپریم کورټ بار ایسوسی ایشن پاکستان", "د سند د عالي محکمې بار ایسوسی ایشن", "د پاکستان میډیټرز ایسوسی ایشن (بنسټ اېښودونکی غړی)", "بحریه پوهنتون (سابق وزټنګ فیکلټي)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "سایمه امین خواجه",
    "role": "مرستیاله مشره – شمال",
    "highlight": "\"د تعلیم او اداري مشرتابه له لارې په قانون کې اصلاحات، د ثالثي غوره والی او د شخړو پایداره حل رامنځته کول.\"",
    "about": "آغلې سایمه امین خواجه د پاکستان میډیټرز ایسوسی ایشن (PMA) د شمالي برخې مرستیاله مشره ده. هغې ته په کارپوریټ قضایاوو، د هېواد په اساسي قانون او د قانون په اصلاحاتو کې پراخه تجربه حاصله ده. هغه په نړیواله کچه روزل شوې ثالثه او ماسټر ټرینره ده چې په پاکستان کې د ADR او د چاپیریال د قانون د ودې لپاره کار کوي.",
    "badges": ["اجرایوي ټیم", "ثالثه", "د CEDR لخوا منل شوې ثالثه", "ماسټر ٹرینره", "د روزنې کمیټه"],
    "expertise": ["کارپوریټ قضایاوې", "آئیني قانون", "قانوني اصلاحات او مشورې", "د چاپیریال قانون", "د ثالثي او ADR روزنه", "د چاپیریال بدلون پالیسي"],
    "experience": { "years": "۲۰+ کاله", "label": "د وکالت، روزنې او مشورې ورکولو تجربه" },
    "accreditations": ["د CEDR لخوا منل شوې ثالثه", "د CEDR ماسټر ټرینره", "د PMA لخوا منل شوې ثالثه", "د چاپیریال قانون روزنه – ایم سي مهتا فاونډیشن، هندوستان"],
    "education": ["ایل ایل ایم (LL.M) – کینګز کالج لندن"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن", "د چاپیریال بدلون کمیسیون – لاهور هایکورټ", "سول سروسز اکاډمي", "جوډیشل اکاډمي", "د لاهور د مدیریت علومو پوهنتون (LUMS)", "یونیورسیټي کالج لاهور (UCL)", "د قانوني مطالعاتو انسټیټیوټ (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "اسفند یار علي خان",
    "role": "مرستیال مشر – شمال",
    "highlight": "\"د مشرتابه، روزنې او اداري تجربې له لارې ثالثي، آربټریشن او قانوني اصلاحاتو ته کار کول.\"",
    "about": "بیریسټر اسفند یار علي خان د پاکستان میډیټرز ایسوسی ایشن (PMA) د شمالي برخې مرستیال مشر او د دې د بنسټ اېښودونکو غړو څخه دی. هغه ته د لنکنز ان د معززې ټولنې لخوا د بار غړیتوب ورکړل شوی دی. هغه د قانون او پرمختګ یو ماهر دی چې په ثالثي، آربټریشن، او د چاپیریال په قوانینو کې پوهه لري او په پاکستان کې د قانوني اصلاحاتو لپاره کار کوي.",
    "badges": ["اجرایوي ټیم", "ثالث", "د CEDR لخوا منل شوی ثالث", "ماسټر ټرینر", "د ضابطه اخلاقو کمیټه"],
    "expertise": ["آربټریشن او ADR", "د کار او روزګار قانون", "د چاپیریال قانون", "د کورنۍ او ځمکې شخړې", "ریګولیټري چارې", "د ثالثي روزنه"],
    "experience": { "years": "۲۰+ کاله", "label": "قانوني پریکټس، ADR او د ټریبیونل مشرتابه" },
    "accreditations": ["د CEDR لخوا منل شوی ثالث", "د CEDR ماسټر ټرینر", "غړی – چارټرډ انسټیټیوټ آف آربټریټرز لندن (MCIArb)", "د PMA لخوا منل شوی ثالث"],
    "education": ["په مسلکي قانوني مهارتونو کې د پوسټ ګریجویټ ډیپلوما – انګلستان", "ایل ایل بي (Hons) – انګلستان", "ایم فل – پاکستان", "ایم اې – پاکستان", "بي اې – پاکستان"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (بنسټ اېښودونکی غړی)", "چارټرډ انسټیټیوټ آف آربټریټرز، لندن", "د خیبر پښتونخوا د چاپیریال ساتنې ټریبیونل", "لنکنز ان، لندن"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "وجیهه علیم",
    "role": "سیکرټري جنرل",
    "highlight": "\"په پاکستان کې د یو قوي ADR فریم ورک لپاره د مشرتابه، نوښت او نړیوالې همکارۍ له لارې د ثالثي وده.\"",
    "about": "آغلې وجیهه علیم د پاکستان میډیټرز ایسوسی ایشن (PMA) د سیکرټري جنرل په توګه کار کوي. هغه په ټول هېواد کې د ثالثي د پیاوړتیا او د شخړو د متبادل حل (ADR) د قانوني کولو لپاره د سټراټیژیکو پروګرامونو مشري کوي. هغې ته د ۱۷ کالو څخه زیات د کارپوریټ او قانوني چارو تجربه ده او د ثالثي د یو معتبر او نړیوال معیار لرونکي نظام په توګه د ودې لپاره هڅې کوي.",
    "badges": ["اجرایوي ټیم", "ثالثه", "د CEDR لخوا منل شوې ثالثه", "ماسټر ټرینره", "اجرایوي مشرتابه"],
    "expertise": ["د شخړو متبادل حل (ADR)", "کارپوریټ او قانوني مشورې", "د ثالثي روزنه", "اداري پرمختګ", "د پالیسیو اصلاحات", "په ADR کې نړیواله همکاري"],
    "experience": { "years": "۱۷+ کاله", "label": "کارپوریټ، قانوني او د ADR مشرتابه" },
    "accreditations": ["د انګلستان د CEDR لخوا منل شوې ثالثه", "د PMA لخوا منل شوې ثالثه", "نړیواله ADR پریکټیشنره"],
    "education": ["ایل ایل ایم (LL.M) – انګلستان", "بي اې، ایل ایل بي (Hons) – د کراچۍ پوهنتون"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن", "نړیوال د ثالثي او ADR شبکې", "عدلي او اداري ADR نوښتونه"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "ماسټر ٹرینر",
    "highlight": "\"د مشرتابه، وکالت او ADR د لارې ثالثي او د نړیوالو شخړو هوارولو کلتور ته وده ورکول.\"",
    "about": "آغا ظفر احمد د پاکستان د سپریم کورټ یو وتلی وکیل، د قانون ماهر او د ADR د برخې مشر دی. هغه د بحري قوانینو، سول قضایاوو، او د نړیوال تجارت په شخړو کې لوی لاس لري. د پاکستان میډیټرز ایسوسی ایشن د مشر په توګه، هغه په پاکستان کې د ثالثي د طریقو د پیاوړتیا لپاره کار کوي.\n\nهغه د CEDR انګلستان لخوا منل شوی ثالث دی او د سند هایکورټ د پینل د ثالث په توګه هم کار کوي. له وکالت سره سره، هغه د پوهنتونونو د وزټنګ ښوونکي په توګه هم د قانون په برخه کې خپل خدمات وړاندې کړي دي.",
    "badges": ["ماسټر ٹرینر", "مشر (PMA)", "اجرایوي مشرتابه"],
    "expertise": ["د ADR او ثالثي روزنه", "د تجارتي شخړو حل", "سمندري قانون (Maritime Law)", "د نړیوال تجارت شخړې", "آربټریشن او د شخړو حل", "سول او کارپوریټ قضایاوې", "د ټرینرانو روزنه (TOT)"],
    "experience": { "years": "۲۱+ کاله", "label": "د وکالت او د شخړو حل" },
    "accreditations": ["د CEDR یوکے منل شوی ثالث", "د سند هایکورټ پینل ثالث", "غړی – مصالحه نړیوال مرکز فار ADR (MICADR)", "د نړیوال آربټریشن قانون ډیپلوما – انګلستان"],
    "education": ["د نړیوال آربټریشن قانون ډیپلوما – د انګلستان د قانون کالج"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د مصالحه نړیوال مرکز فار ADR", "د سند هایکورټ", "د سپریم کورټ بار ایسوسی ایشن", "د سند هایکورټ بار ایسوسی ایشن", "بحریه پوهنتون"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "مستنصر ذاکر",
    "role": "ماسټر ٹرینر",
    "highlight": "\"د سټراټیژیک مشرتابه او د ADR د غوره والي له لارې د کارپوریټ ګورننس او د ثالثي د روزنې د پروګرامونو مشري کول.\"",
    "about": "مستنصر ذاکر د کارپوریټ یو تکړه مشر، منل شوی ثالث او د ADR نړیوال روزونکی دی چې د مدیریت او کارپوریټ ګورننس په برخه کې پراخه تجربه لري. هغه د پاکستان میډیټرز ایسوسی ایشن (PMA) د روزنې ډائیرکټر دی او په ټول هېواد کې د ثالثي د شعور د بیدارولو لپاره کار کوي.\n\nهغه د ICAP، ICMAP او ICSP فیلو غړی دی او دا مهال په هاشو ګروپ کې د چیف ایګزیکټیو په توګه دندې ترسره کوي. هغه د امریکا د کارنیل پوهنتون څخه د سټراټیژیک مدیریت تصدیق پاڼه اخیستې ده او د یو ماسټر ټرینر په توګه یې په پاکستان کې د قانوني او اداري پرمختګونو لپاره ډېر کار کړی دی.",
    "badges": ["ماسټر ٹرینر", "د روزنې ډائریکټر", "اجرایوي کمیټه – سویل", "سابق صدر"],
    "expertise": ["د ADR او ثالثي روزنه", "کارپوریټ ګورننس", "سټراټیژیک مدیریت", "د مشرتابه پرمختګ", "د تجارتي شخړو حل", "د ټرینرانو روزنه (TOT)", "اداري وړتیا رامنځته کول"],
    "experience": { "years": "۲۰+ کاله", "label": "اجرایوي مشرتابه او د ADR روزنه" },
    "accreditations": ["د CEDR یوکے منل شوی ثالث", "د CEDR یوکے ماسټر ټرینر", "منل شوی ډائریکټر – د کارپوریټ ګورننس انسټیټیوټ پاکستان", "د سټراټیژیک مدیریت سرټیفیکیشن – کارنیل پوهنتون، امریکا"],
    "education": ["فیلو – د چارټرډ اکاونټنټس انسټیټیوټ پاکستان (ICAP)", "فیلو – د کاسټ او مدیریت اکاونټنټس انسټیټیوټ پاکستان (ICMAP)", "فیلو – د کارپوریټ سیکرټریانو انسټیټیوټ پاکستان (ICSP)"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "هاشو ګروپ", "د پاکستان د هوټلونو ټولنه (PHA)", "د ودانیو جوړونکو ټولنه (ABAD)", "د چارټرډ اکاونټنټس انسټیټیوټ پاکستان", "د پاکستان د کارپوریټ ګورننس انسټیټیوټ", "د کراچۍ سی سکاوټ کونسل ټرسټ"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "وجیهه علیم",
    "role": "ماسټر ٹرینره",
    "highlight": "\"په پاکستان کې د یو قوي ADR فریم ورک لپاره د مشرتابه، نوښت او نړیوالې همکارۍ له لارې د ثالثي وده.\"",
    "about": "وجیهه علیم د هایکورټ وکیله، منل شوې ثالثه او د قانون ماهره ده چې په کارپوریټ چارو او د شخړو په متبادل حل (ADR) کې تجربه لري. هغه دا مهال د پاکستان میډیټرز ایسوسی ایشن (PMA) سیکرټري جنرال ده او همدا رنګ په هاشو ګروپ کې د جنرال مدیرې (قانوني او عملیاتي) په توګه کار کوي.\n\nهغې د انګلستان څخه په نړیوال تجارتي قانون او ADR کې ایل ایل ایم کړی دی او د تایلینډ د آربټریشن مرکز (THAC) غړیتوب هم لري. هغه د سند په عالي محکمه کې د ثالثې په توګه راجستر ده.",
    "badges": ["ماسټر ٹرینره", "سیکرټري جنرال", "اجرایوي مشرتابه"],
    "expertise": ["د ADR او ثالثي روزنه", "نړیوال تجارتي قانون", "کارپوریټ قانوني مشورې", "د تجارتي شخړو حل", "اداري ADR پرمختګ", "د مسلکي مهارتونو روزنه", "د شخړو حل"],
    "experience": { "years": "۱۷+ کاله", "label": "کارپوریټ، قانوني او د ADR مشرتابه" },
    "accreditations": ["د CEDR لخوا منل شوې ثالثه", "د سند هایکورټ پینل ثالثه", "اسوسی ایټ ټرینره – PMA", "د THAC غړیتوب – د تایلینډ آربټریشن مرکز"],
    "education": ["په نړیوال تجارتي قانون او ADR کې ایل ایل ایم – انګلستان", "بي اې، ایل ایل بي (Hons) – پاکستان"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د تایلینډ آربټریشن مرکز (THAC)", "د سند هایکورټ", "د سند بار کونسل", "د کراچۍ بار ایسوسی ایشن", "نړیوال بار ایسوسی ایشن", "هاشو ګروپ"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "هما شاه",
    "role": "ماسټر ٹرینره",
    "highlight": "\"د مشرتابه، وکالت او مسلکي لارښوونې له لارې د کارپوریټ قانوني غوره والي او د ثالثي روزنې وده.\"",
    "about": "هما شاه د قانون په برخه کې یوه خورا تجربه کاره مسلمه مشره ده چې د قانوني پریکټس موده یې له دېرش کالو زیاته ده. له ۱۹child کال راهیسې هغې د پاکستان د مشهورو قانوني ادارو لکه د عاصمې جهانګیر او هنا جیلاني تر مشرۍ لاندې د AGHS لیګل ایډ سیل او Surridge & Beecheno سره کار کړی دی.\n\nهغه په SSR&I کې مینیجنګ پارټنر پاتې شوې او دا مهال په HBL بانک کې د شمالي برخې د قانوني چارو مشره ده. هغه د انګلستان د بار کونسل تر لاندې د پاکستان د ایډوکیسي روزنې پروګرام یوه منل شوې ټرینره ده.",
    "badges": ["ماسټر ٹرینره", "اجرایوي کمیټه – شمال", "د روزنې کمیټه"],
    "expertise": ["د ADR او ثالثي روزنه", "کارپوریټ او تجارتي قانون", "د وکالت او قانوني مهارتونو روزنه", "د معاهدو لیکل او کتنه", "د بانکي او کارپوریټ چارو مشورې", "د شخړو حل", "د ټرینرانو روزنه (TOT)"],
    "experience": { "years": "۳۰+ کاله", "label": "قانوني پریکټس، کارپوریټ مشورې او د ADR روزنه" },
    "accreditations": ["د CEDR یوکے منل شوې ثالثه", "د CEDR یوکے ماسټر ٹرینره", "منل شوې ټرینره – د پاکستان ایډوکیسي روزنې پروګرام (IATC)"],
    "education": ["پنجاب لاء کالج – د عالي تعلیمي رتبې له کبله دوه ځله د سرو زرو مډال ګټونکې"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د انګلستان د بار کونسل (IATC)", "حبیب بانک لمیټډ (HBL)", "د پنجاب بار ایسوسی ایشنونه", "د AGHS لیګل ایډ سیل", "میسرز سروج او بیچینو"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "عثمان جي راشد",
    "role": "ماسټر ٹرینر",
    "highlight": "\"په ټول پاکستان کې د ADR د وړتیا لوړولو لپاره د قانوني وکالت، د ثالثي پوهې او د روزنې د مشرتابه یوځای کول.\"",
    "about": "عثمان جي راشد بیرسټر ایټ لاء او د هایکورټونو وکیل دی. هغه د لندن پوهنتون څخه ایل ایل بي او د کینګز کالج لندن څخه ایل ایل ایم کړی دی او د لنکنز ان د ټولنې لخوا بار ته رابلل شوی دی. هغه د پاکستان میډیټرز ایسوسی ایشن پخوانی سیکرټري جنرال پاتې شوی او په هېواد کې د قانوني زده کړو او روزنې لپاره کار کوي. هغه د لندن پوهنتون د بهرني پروګرام لپاره د کمپنیو قانون او د شواهدو قانون (Law of Evidence) هم لولي.",
    "badges": ["ماسټر ٹرینر", "بیرسټر ایټ لاء", "پخوانی سیکرټري جنرال – PMA"],
    "expertise": ["د ADR او ثالثي روزنه", "د وکالت د مهارتونو روزنه", "د کمپنیو قانون", "د شواهدو قانون", "تجارتي او سول قضایاوې", "قانوني تعلیم او مسلکي پرمختګ", "د شخړو حل"],
    "experience": { "years": "۱۵+ کاله", "label": "د CEDR لخوا منل شوی ماسټر ټرینر او قانوني ښوونکی" },
    "accreditations": ["د CEDR منل شوی ثالث او ماسټر ټرینر – انګلستان", "بیرسټر ایټ لاء – لنکنز ان", "منل شوی د ایډوکیسي ټرینر"],
    "education": ["ایل ایل ایم – کینګز کالج، د لندن پوهنتون", "ایل ایل بي (Hons) – د لندن پوهنتون", "بار ووکیشنل کورس – د ویسټ آف انګلستان پوهنتون، برسټل۔"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د لنکنز ان معززه ټولنه", "یونیورسیټي کالج لاهور", "د لندن پوهنتون ایکسټرنل پروګرام", "عنایت الله چیمبرز، قانوني مشاورین"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "اسفند یار علي خان",
    "role": "ماسټر ٹرینر",
    "highlight": "\"د مشرتابه، روزنې او اداري تجربې له لارې ثالثي، آربټریشن او قانوني اصلاحاتو ته کار کول.\"",
    "about": "اسفند یار علي خان د قانون یو سینئر پریکټیشنر او د ثالثي د برخې نړیوال ماهر دی. هغه په S&K پارټنرشپ کې سینئر پارټنر او د پاکستان میډیټرز ایسوسی ایشن نائب صدر دی. هغه د لنکنز ان لندن لخوا د بار غړی دی او د ملګرو ملتونو (UN) او UNDP د بیلا بیلو پرمختیایي پروژو سره یې د قانوني مشاور په توګه کار کړی دی.",
    "badges": ["ماسټر ٹرینر", "اداري مشرتابه", "نائب صدر – شمال"],
    "expertise": ["د ADR او ثالثي روزنه", "آربټریشن او د شخړو حل", "تجارتي او سول شخړې", "قانوني مهارتونو پرمختګ", "اداري ADR وړتیا لوړول", "د مسلکي پرمختګ پروګرامونه", "د ټرینرانو روزنه (TOT)"],
    "experience": { "years": "۲۰+ کاله", "label": "قانوني پریکټس، ADR او د ټریبیونل مشرتابه" },
    "accreditations": ["د CEDR یوکے منل شوی ثالث", "د CEDR یوکے ماسټر ټرینر", "غړی – چارټرډ انسټیټیوټ آف آربټریټرز (MCIArb) لندن", "بیرسټر ایټ لاء – لنکنز ان، لندن"],
    "education": ["مسلکي قانوني مهارتونو کې ډیپلوما – انګلستان", "ایل ایل بي (Hons) – انګلستان", "ایم اې – پاکستان", "بي اې – پاکستان"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "چارټرډ انسٹی تیوت آف آربټریټرز، لندن", "لنکنز ان، لندن", "پاکستان ریډ کریسنټ سوسایټي (PRCS)", "د چاپیریال د قوانینو ټولنه", "برټش ایلومنایي ایسوسی ایشن", "د ملګرو ملتونو پرمختیایي پروژې"],
    "media": []
  },
  "trainer_saima_amin_khawaja": {
    "name": "سایمه امین خواجه",
    "role": "ماسټر ٹرینره",
    "highlight": "\"د تعلیم او اداري مشرتابه له لارې د قانوني اصلاحاتو، ثالثي د غوره والي او د شخړو پایداره حل رامنځته کول.\"",
    "about": "سایمه امین خواجه د قانون په برخه کې یوه خورا تکړه مسلكي مسلمه مشره ده، منل شوې ثالثه او په نړیواله کچه د ADR ماهره ده، چې په کارپوریټ قضایاوو، آئیني قانون، قانوني مشورو او اداري اصلاحاتو کې پراخه تجربه لري. هغې په پاکستان کې د ثالثي د بیدارۍ، د ADR د روزنې او د قانوني پرمختګ په پروګرامونو کې مهم رول لوبولی دی.\n\nهغې د کینګز کالج لندن څخه ایل ایل ایم (LL.M) کړی او د هندوستان د ایم سي مهتا فاونډيشن څخه یې په چاپیریالي قوانینو کې تخصصي روزنه ترلاسه کړې ده. د CEDR انګلستان د منل شوې ثالثې او ماسټر ټرینر په توګه، هغې د مسلکي ثالثي د وړتیا لوړولو پروګرامونو کې فعاله برخه اخیستې ده. هغې په LUMS پوهنتون، د سول سروسز اکاډمۍ، جوډیشل اکاډمۍ، TILS او UCL کې تدریس کړی دی، او د لاهور هایکورټ لخوا جوړ شوي د چاپیریال بدلون کمیسیون غړې هم پاتې شوې ده.",
    "badges": ["ماسټر ٹرینره", "اجرایوي غړې", "نائب صدر – شمال"],
    "expertise": ["د ADR او ثالثي روزنه", "کارپوریټ او آئیني قانون", "قانوني اصلاحات او پالیسي جوړونه", "د چاپیریال قانون", "عدلي او مسلکي روزنه", "د شخړو حل", "د ٹرینرانو روزنه (TOT)"],
    "experience": { "years": "۲۰+ کاله", "label": "قانوني پریکټس، روزنه او مشورتي خدمات" },
    "accreditations": ["د CEDR انګلستان منل شوې ثالثه", "د CEDR انګلستان ماسټر ټرینره", "د چاپیریال قانون تخصصي روزنه – ایم سي مهتا فاونډيشن، هندوستان"],
    "education": ["ایل ایل ایم (LL.M) – کینګز کالج لندن"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "لاهور هایکورټ", "د لاهور د مدیریت علومو پوهنتون (LUMS)", "سول سروسز اکاډمي", "جوډیشل اکاډمي", "TILS", "UCL", "ایم سي مهتا فاونډيشن، هندوستان"],
    "media": []
  },
  "trainer_tariq_saeed_rana": {
    "name": "طارق سعید رانا",
    "role": "ماسټر ٹرینر",
    "highlight": "\"د نړیوال مهارت، مسلکي روزنې او ADR مشرتابه له لارې د کارپوریټ قانوني پریکټس او د ثالثي غوره والي مشري کول.\"",
    "about": "طارق سعید رانا یو سینئر قانوني مشاور، منل شوی ثالث، او په نړیواله کچه پیژندل شوی د ADR ټرینر دی چې په کارپوریټ او تجارتي قوانینو کې پراخه تجربه لري. هغه ته د انګلستان د لنکنز ان د معززې ټولنې لخوا د بار غړیتوب ورکړل شوی دی. هغه دا مهال په Surridge & Beecheno کې د کارپوریټ او کمرشل لاء د برخې مشري کوي او په پاکستان کې د ثالثي د روزنې، قانوني مشورو او د اداري ADR ودې لپاره کار کوي.\n\nهغه د CEDR انګلستان منل شوی ثالث او ماسټر ټرینر دی چې د کارپوریټ ګورننس، قانوني مشورې او د مسلکي وړتیا لوړولو په برخه کې کار کوي. هغه په فعاله توګه د ډائریکټرانو د روزنې پروګرامونه پرمخ وړي او په قانوني او سوداګریزو ادارو کې د مشرتابه دندې ترسره کوي.",
    "badges": ["ماسټر ٹرینر", "سابق صدر", "اجرایوي کمیټه – شمال"],
    "expertise": ["د ADR او ثالثي روزنه", "کارپوریټ او تجارتي قانون", "د ډائریکټرانو د روزنې پروګرامونه", "کارپوریټ ګورننس", "د تجارتي شخړو حل", "مسلکي قانوني پرمختګ", "د ٹرینرانو روزنه (TOT)"],
    "experience": { "years": "۲۵+ کاله", "label": "قانوني پریکټس، ADR او کارپوریټ مشورتي خدمات" },
    "accreditations": ["د CEDR انګلستان منل شوی ثالث", "د CEDR انګلستان ماسټر ټرینر", "مستدعی بار – لنکنز ان، انګلستان"],
    "education": ["په تجارتي قوانینو کې ایل ایل ایم – انګلستان", "په قانون کې پوسټ ګریجویټ ډیپلوما – انګلستان", "ایل ایل بي – پاکستان", "ایسوسی ایټ انجینرنګ (میخانیکل) – پاکستان"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د لنکنز ان معززه ټولنه، لندن", "د انګلستان او ویلز د بار عمومي کونسل", "د لاهور هایکورټ بار ایسوسی ایشن", "پنجاب بار کونسل", "د لاهور چیمبر آف کامرس او انډسټري", "Surridge & Beecheno"],
    "media": []
  },
  "saeed_habib": {
    "name": "سعید حبیب",
    "role": "نائب صدر – سویل",
    "highlight": "",
    "about": "",
    "badges": ["د غړیتوب کمیټه", "اداري همغږي"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "shabana_ali": {
    "name": "شبانة علي",
    "role": "نائب صدر – سویل",
    "highlight": "\"د وکالت، تعلیم او د شخړو د حل له لارې د ثالثي، قانوني بیدارۍ او ټولنیز عدالت وده.\"",
    "about": "آغلې شبانه علي د پاکستان میډیټرز ایسوسی ایشن (PMA) د سویل د برخې مرستیاله مشره ده. هغه د سول، ټیکس او کارپوریټ قوانینو تجربه لرونکې وکیله ده چې په قضایاوو، قانوني مشورو او د شخړو په حل کې کار کوي. هغه په پاکستان کې د ثالثي د ودې لپاره کار کوي او د ټولنیز عدالت او د ښځو او ماشومانو د حقونو د ساتنې لپاره پیژندل شوې ده.",
    "badges": ["اجرایوي ټیم", "ثالثه", "د PMA منل شوې ثالثه", "بار همغږي – سویل", "مشرتابه"],
    "expertise": ["سول قانون", "کارپوریټ قانون", "د کورنۍ شخړې", "د مالیاتو (ټیکس) قانون", "ثالثي او ADR", "د ښځو او ماشومانو د حقونو وکالت"],
    "experience": { "years": "۲۰+ کاله", "label": "قانوني پریکټس، ثالثي او د عامه حقونو وکالت" },
    "accreditations": ["د PMA منل شوې ثالثه", "منل شوې د ثالثي پریکټیشنره"],
    "education": ["په سول، کارپوریټ او ټیکس قانون کې قانوني او مسلکي زده کړې"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن", "د پاکستان انسټیټیوټ آف پبلک فینانس اکاونټنټس (PIPFA)", "اجرایوي کمیټه – PMA", "په میډیا کې قانوني څیړونکې او ویناواله"],
    "media": ["پاکستان ټیلیویژن کارپوریشن (PTV)", "آج نیوز", "ټي وي ون", "میټرو نیوز"]
  },
  "syed_sammad_ul_haque": {
    "name": "سید صمد الحق",
    "role": "مالي سیکرټري",
    "highlight": "",
    "about": "",
    "badges": ["د غړیتوب کمیټه", "اجرایوي مشرتابه"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "tariq_saeed_rana": {
    "name": "طارق سعید رانا",
    "role": "اجرایوي کمیټه – شمال",
    "highlight": "\"د نړیوال مهارت، مسلکي روزنې او ADR مشرتابه له لارې د کارپوریټ قانوني پریکټس او د ثالثي غوره والي مشري کول.\"",
    "about": "بیریسټر طارق سعید رانا د قانون یو سینئر پریکټیشنر، منل شوی ثالث، او ماسټر ټرینر دی چې په کارپوریټ او تجارتي قوانینو کې مهارت لري. هغه ته د انګلستان د لنکنز ان لخوا د بار غړیتوب ورکړل شوی دی او دا مهال په Surridge & Beecheno کې د کارپوریټ او کمرشل لاء د برخې مشري کوي. د قانوني مشورو، ADR او مسلکي روزنې په برخه کې د لسیزو تجربې سره، هغه په پاکستان کې د ثالثي د ودې لپاره کار کوي.",
    "badges": ["اجرایوي ټیم", "ثالث", "د CEDR منل شوی ثالث", "ماسټر ټرینر", "سابق صدر"],
    "expertise": ["کارپوریټ او تجارتي قانون", "ثالثي او ADR", "نړیوالې تجارتي شخړې", "قانوني مشورې", "کارپوریټ ګورننس", "مسلکي روزنه"],
    "experience": { "years": "۲۵+ کاله", "label": "قانوني پریکټس، ADR او کارپوریټ مشورتي خدمات" },
    "accreditations": ["د CEDR منل شوی ثالث", "د CEDR ماسټر ټرینر", "مستدعي بار – لنکنز ان، انګلستان", "د PMA منل شوی ثالث"],
    "education": ["ایل ایل ایم (تجارتي قوانين) – انګلستان", "په قانون کې پوسټ ګریجویټ ډیپلوما – انګلستان", "ایل ایل بي – Pakistan", "ایسوسی ایټ انجینرنګ (میخانیکل) – پاکستان"],
    "affiliations": ["د انګلستان او ویلز د بار عمومي کونسل", "د لنکنز ان معززه ټولنه، لندن", "د پاکستان میډیټرز ایسوسی ایشن", "د لاهور هایکورټ بار ایسوسی ایشن", "پنجاب بار کونسل", "د لاهور چیمبر آف کامرس او انډسټري"],
    "media": []
  },
  "huma_shah": {
    "name": "هما شاه",
    "role": "اجرایوي کمیټه – شمال",
    "highlight": "\"د مشرتابه، وکالت او مسلکي لارښوونې له لارې د کارپوریټ قانوني غوره والي او د ثالثي روزنې وده.\"",
    "about": "آغلې هما شاه د کارپوریټ قوانینو، قانوني مشورو، تجارتي ډرافټینګ او د شخړو په حل کې پراخه تجربه لري. هغه له ۱۹۹۳ کال راهیسې د قانون په برخه کې پریکټس کوي او د پاکستان د مشهورو قانوني ادارو لکه د عاصمې جهانګیر تر مشرۍ لاندې د AGHS او Surridge & Beecheno سره یې کار کړی دی. هغه دا مهال په HBL بانک کې د شمالي برخې د قانوني چارو مشره ده.",
    "badges": ["اجرایوي ټیم", "ثالثه", "د CEDR منل شوې ثالثه", "ماسټر ټرینره", "د روزنې کمیټه"],
    "expertise": ["کارپوریټ او تجارتي قانون", "قانوني مشورې", "تجارتي ډرافټینګ او کتنه", "د بانکي او مالي چارو قانون", "ثالثي او ADR", "د وکالت روزنه"],
    "experience": { "years": "۳۰+ کاله", "label": "قانوني پریکټس، کارپوریټ مشورې او د ADR روزنه" },
    "accreditations": ["د CEDR منل شوې ثالثه", "د CEDR ماسټر ټرینره", "منل شوې د وکالت ټرینره – IATC (د انګلستان او ویلز بار کونسل)", "د PMA منل شوې ثالثه"],
    "education": ["پنجاب لاء کالج – د سرو زرو مډال ګټونکې (د عالي تعلیمي رتبې له کبله دوه ځله)"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن", "انز آف کورټ ایډوکیسی ټریننګ پروګرام پاکستان", "د پنجاب بار ایسوسی ایشنونه", "HBL – لیګل هیډ نارتھ"],
    "media": []
  },
  "umaimah_anwar_khan": {
    "name": "أميمة أنور خان",
    "role": "اجرایوي کمیټه – سویل",
    "highlight": "",
    "about": "",
    "badges": ["ضابطه اخلاق", "بار همغږي – سویل"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "mustansir_zakir": {
    "name": "مستنصر ذاکر",
    "role": "اجرایوي کمیټه – سویل",
    "highlight": "\"د سټراټیژیک مشرتابه او د ADR د غوره والي له لارې د کارپوریټ ګورننس او د ثالثي د روزنې د پروګرامونو مشري کول.\"",
    "about": "ښاغلی مستنصر ذاکر د کارپوریټ یو سینئر مشر، منل شوی ثالث، او ماسټر ټرینر دی چې د کارپوریټ ګورننس، هوسپیټلیټي، فینانس او د شخړو متبادل حل (ADR) کې د مشرتابه تجربه لري. هغه دا مهال په هاشو ګروپ کې د چیف ایګزیکټیو په توګه کار کوي او د پاکستان میډیټرز ایسوسی ایشن (PMA) د لارې یې په هیواد کې د ثالثي د بیدارۍ لپاره ډیر خدمات وړاندې کړي دي.",
    "badges": ["اجرایوي ټیم", "ثالث", "د CEDR منل شوی ثالث", "د روزنې ډائریکټر", "ماسټر ټرینر", "سابق صدر"],
    "expertise": ["کارپوریټ ګورننس", "سټراټیژیک مدیریت", "د ثالثي او ADR روزنه", "هوسپیټلیټي او د سوداګرۍ مشرتابه", "مالي مدیریت", "اداري پرمختګ"],
    "experience": { "years": "۳۰+ کاله", "label": "کارپوریټ مشرتابه، ګورننس او ADR" },
    "accreditations": ["د CEDR منل شوی ثالث", "د CEDR ماسټر ټرینر", "سرټیفایډ ډائریکټر ایجوکیشن – PICG", "د سټراټیژیک مدیریت سرټیفیکیشن – کارنیل پوهنتون، امریکا"],
    "education": ["فیلو – د چارټرډ اکاونټنټس انسټیټیوټ پاکستان (ICAP)", "فیلو – د کاسټ او مدیریت اکاونټنټس انسټیټیوټ پاکستان (ICMAP)", "فیلو – د کارپوریټ سیکرټریانو انسټیټیوټ پاکستان (ICSP)"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (سابق صدر او د روزنې ډائریکټر)", "هاشو ګروپ – چیف ایګزیکټیو", "د پاکستان هوټلونو ټولنه (پخوانی چیئرمین)", "د ودانیو جوړونکو ټولنه (ABAD)", "د کراچۍ سی سکاوټ کونسل ټرسټ – مینیجنګ ټرسټي"],
    "media": []
  },
  "usman_g_rashid": {
    "name": "عثمان جي راشد",
    "role": "غړی",
    "highlight": "\"په ټول پاکستان کې د ADR د وړتیا لوړولو لپاره د قانوني وکالت، د ثالثي پوهې او د روزنې د مشرتابه یوځای کول.\"",
    "about": "عثمان جي راشد بیرسټر ایټ لاء او د عالي محکمو (هایکورټونو) وکیل دی، د CEDR منل شوی ثالث او ماسټر ټرینر دی چې د قانون په برخه کې پراخه تجربه لري. هغه د لندن پوهنتون څخه ایل ایل بي او د کینګز کالج لندن څخه ایل ایل ایم کړی دی او د لنکنز ان د ټولنې لخوا بار ته رابلل شوی دی. هغه د پاکستان میډیټرز ایسوسی ایشن پخوانی سیکرټري جنرال پاتې شوی او په هېواد کې د قانوني زده کړو او روزنې لپاره کار کوي. هغه د لندن پوهنتون د بهرني پروګرام لپاره د کمپنیو قانون او د شواهدو قانون هم لولي.\n\nعثمان خپل کانیز کلو پیل له عمر بنديال او همکارانو سره کړی او اوس مهال د عنايت الله چيمبرز له لارې خپل کارونه پرمخ وړي.",
    "badges": ["ثالث", "ماسټر ټرینر", "بیرسټر ایټ لاء"],
    "expertise": ["د ADR او ثالثي روزنه", "د وکالت د مهارتونو روزنه", "د کمپنیو قانون", "د شواهدو قانون", "تجارتي او سول قضایاوې", "قانوني تعلیم او مسلکي پرمختګ", "د شخړو حل"],
    "experience": { "years": "", "label": "د CEDR لخوا منل شوی ثالث او ماسټر ټرینر" },
    "accreditations": ["د CEDR منل شوی ثالث او ماسټر ټرینر – انګلستان", "بیرسټر ایټ لاء – لنکنز ان", "منل شوی د ایډوکیسي ټرینر"],
    "education": ["ایل ایل ایم – کینګز کالج، د لندن پوهنتون", "ایل ایل بي (Hons) – د لندن پوهنتون", "بار ووکیشنل کورس – د ویسټ آف انګلستان پوهنتون، برسټل۔"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "د لنکنز ان معززه ټولنه", "یونیورسیټي کالج لاهور", "د لندن پوهنتون ایکسټرنل پروګرام", "عنایت الله چیمبرز، وکیلان او قانوني مشاورین"],
    "media": []
  },
  "adnan_mufti": {
    "name": "عدنان مفتي",
    "role": "اجرایوي کمیټه – سویل",
    "highlight": "",
    "about": "",
    "badges": ["اداري همغږي", "مشرتابه"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "anwar_kashif_mumtaz": {
    "name": "أنور كاشف ممتاز",
    "role": "ماسټر ٹرینر",
    "highlight": "",
    "about": "أنور کاشف ممتاز د قانون یو سینئر پریکټیشنر، د مشرتابه روزونکی او منل شوی ثالث دی چې په کارپوریټ، مالیاتو (ټیکس) او د شخړو په حل کې کار کوي. د هایکورټ د وکیل او په Saiduddin & Co. کې د سینئر ملګري په توګه، هغه په هیواد کې د مالیاتو او کارپوریټ مشورو په برخه کې ښه نوم لري.\n\nهغه د مشرتابه او شخصي پرمختګ یو نړیوال منل شوی ټرینر دی او د CEDR انګلستان لخوا منل شوی ثالث دی. هغه د پاکستان ټیکس بار او کراچۍ ټیکس بار د پخواني مشر او سیکرټري په توګه هم دندې ترسره کړې دي.",
    "badges": ["ماسټر ٹرینر", "سابق صدر", "د مشرتابه روزونکی"],
    "expertise": ["مشرتابه او شخصي پرمختګ", "د ADR او ثالثي روزنه", "کارپوریټ قانون", "د ټیکس قانون او مشورې", "د مسلکي پرمختګ پروګرامونه", "د شخړو حل", "د ٹرینرانو روزنه (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["د CEDR انګلستان منل شوی ثالث", "د CEDR انګلستان ماسټر ټرینر", "منل شوی نړیوال ټرینر – مشرتابه او شخصي پرمختګ"],
    "education": ["وکیل، د پاکستان عالي محکمه (هایکورټ)"],
    "affiliations": ["د پاکستان میډیټرز ایسوسی ایشن (PMA)", "CEDR انګلستان", "پاکستان ټیکس بار", "کراچۍ ټیکس بار", "پبلک انټرسټ لاء ایسوسی ایشن پاکستان (PILAP)", "میسرز سید الدین او همکاران"],
    "media": []
  }
  },
          "former_presidents": {
            "president_1": {
              "name": "انور کاشف ممتاز",
              "title": "پخوانی مشر (سابق صدر)"
            },
            "president_2": {
              "name": "مستنصر ذاکر",
              "title": "پخوانی مشر (سابق صدر)"
            },
            "president_3": {
              "name": "طارق سعید رانا",
              "title": "پخوانی مشر (سابق صدر)"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "د ننه کمېټه (ذیلي کمیټه)",
              "subtitle": "زموږ فرعي کمېټې د تخصص، همکارۍ او وقف شوي خدمت له لارې کلیدي نوښتونه پرمخ وړي او د PMA د ماموریت ملاتړ کوي.",
              "expand_all": "ټول خلاصول"
            },
            "labels": {
              "mandate": "واک / ماموریت:",
              "director": "ډایرکټر",
              "convener": "کنوینر"
            },
            "committees": {
              "training": {
                "title": "د روزنې کمېټه",
                "mandate": "لارښود، روزنه، تصدیق/اعتبار ورکول/د بیا کتنې کورسونه/د روزونکو روزنه (TOT)",
                "lead_name": "مستنصر ذاکر",
                "members": [
                  "انور کاشف ممتاز",
                  "سائمه خواجه",
                  "طارق رانا",
                  "هما شاه",
                  "اسفندیار علي خان"
                ]
              },
              "conduct": {
                "title": "د چلند د اصولو کمېټه",
                "mandate": "د روغې جوړې کونکو (ثالثانو) لپاره د چلند اصول چمتو کول او په ټول هیواد کې د هغې د پلي کولو لپاره د عدلیې وزارت څخه د تصویب ترلاسه کولو هڅه کول",
                "lead_name": "امیمه خان",
                "members": [
                  "انور کاشف ممتاز",
                  "سائمه خواجه",
                  "خالد محمود",
                  "عدنان مفتي",
                  "طارق رانا",
                  "اسفندیار علي خان"
                ]
              },
              "membership": {
                "title": "د غړیتوب کمېټه",
                "mandate": "د زوړ غړیتوب ساتل او فعالول، د نورو موسسو د منل شویو ثالثانو په بللو سره د غړیتوب پورټ فولیو پراخول او همدارنګه د همکارو او افتخاري غړو درلودل.",
                "lead_name": "سعید حبیب",
                "members": [
                  "خالد محمود",
                  "سائمه خواجه",
                  "صمد الحق",
                  "اسفندیار علي خان"
                ]
              },
              "bar_south": {
                "title": "قانوني او اکاډمیک همغږي – سویل",
                "mandate": "د غونډو، سیمینارونو، لارښوونو او روزنیزو ورکشاپونو د تنظیم کولو لپاره د بار ایسوسی ایشن / بار کونسل او د قانون د ښوونځیو سره همغږي",
                "lead_name": "شبانه علي",
                "members": [
                  "سعادت یار خان",
                  "امیمه خان",
                  "اغلې خالد محمود",
                  "صمد الحق",
                  "منصور میر",
                  "نوید احمد"
                ]
              },
              "bar_north": {
                "title": "قانوني او اکاډمیک همغږي – شمال",
                "mandate": "د غونډو، سیمینارونو、لارښوونو او روزنیزو ورکشاپونو د تنظیم کولو لپاره د بار ایسوسی ایشن / بار کونسل او د قانون د ښوونځیو سره همغږي",
                "lead_name": "سائمه خواجه",
                "members": [
                  "ظفر کلانوري",
                  "بېریسټر طارق رانا",
                  "اسفندیار علي خان"
                ]
              },
              "institutional": {
                "title": "د اداري همغږۍ کمېټه",
                "mandate": "د سوداګرۍ خونو، سوداګریزو ارګانونو، مسلکي اتحادیو / موسسو سره همغږي",
                "lead_name": "عدنان مفتي",
                "members": [
                  "مستنصر ذاکر",
                  "سعید حبیب",
                  "طارق رانا",
                  "اسفندیار علي خان",
                  "صمد الحق"
                ]
              }
            },
            "footer_note": "آغا ظفر احمد (ولسمشر) او وجیهه علیم (عمومي منشي) د هرې کمېټې د رسمي غړو (Ex. Officio) په توګه دندې ترسره کوي."
          },
          "mediators": {
            "adnan-mufti": { "name": "عدنان مفتي", "role": "غړی" },
            "anwar-kashif-mumtaz": { "name": "انور کاشف ممتاز", "role": "غړی" },
            "ayesha-sarfraz-ali-khan": { "name": "عایشه سرفراز علي خان", "role": "غړی" },
            "barrister-tariq-saeed-lahore": { "name": "بېریسټر طارق سعید", "role": "غړی" },
            "farrukh-junaidy": { "name": "فرخ جنیدي", "role": "غړی" },
            "huma-shah": { "name": "هما شاه", "role": "غړی" },
            "ishtiaq-memon": { "name": "اشتیاق میمن", "role": "غړی" },
            "isfandyar-ali-khan": { "name": "اسفندیار علي خان", "role": "غړی" },
            "khalid-firoz-arfeen": { "name": "خالد فیروز عارفين", "role": "غړی" },
            "khalid-mahmood-siddiqui": { "name": "خالد محمود صدیقي", "role": "غړی" },
            "mohammad-rehan-siddqui": { "name": "محمد ریحان صدیقي", "role": "غړی" },
            "mustansir-zakir": { "name": "مستنصر ذاکر", "role": "غړی" },
            "nausheen-ahmed": { "name": "نوشین احمد", "role": "غړی" },
            "neelofar-hameed": { "name": "نیلوفر حمید", "role": "غړی" },
            "omair-nisar-khan": { "name": "عمیر نثار خان", "role": "غړی" },
            "raheem-hasnani": { "name": "رحیم حسناني", "role": "غړی" },
            "reshma-aftab": { "name": "ریشما آفتاب", "role": "غړی" },
            "rubina-virani": { "name": "روبینا ویراني", "role": "غړی" },
            "saadat-yar-khan": { "name": "سعادت یار خان", "role": "غړی" },
            "saeed-habib": { "name": "سعید حبیب", "role": "غړی" },
            "saima-khawaja": { "name": "سائمه امین خواجه", "role": "غړی" },
            "salina-khalfan": { "name": "سالینا خلفان", "role": "غړی" },
            "shabana-ali": { "name": "شبانه علي", "role": "غړی" },
            "shaheen-premani": { "name": "شاهین برېمني", "role": "غړی" },
            "syed-haider-imam-rizvi": { "name": "سید حیدر امام رضوي", "role": "غړی" },
            "syed-sammadul-haque": { "name": "سید صمد الحق", "role": "غړی" },
            "tahmasp-r-razvi": { "name": "طهمسپ آر رضوي", "role": "غړی" },
            "umaimah-a-rizvi": { "name": "امیمه اې رضوي", "role": "غړی" },
            "usman-g-rashid": { "name": "عثمان جي راشد", "role": "غړی" },
            "wajiha-aleem": { "name": "وجیهه علیم", "role": "غړی" },
            "yousuf-moulvi": { "name": "یوسف مولوي", "role": "غړی" },
            "zafar-kalanauri": { "name": "ظفر کلانوري", "role": "غړی" },
            "zia-makhdoom": { "name": "ضیاء مخدوم", "role": "غړی" }
          }

        },
        "resources_page": {
          "hero": {
            "image_alt": "د خدماتو هیرو عکس",
            "eyebrow": "سرچينې (RESOURCES)",
            "title_line1": "پوهه. قانون.",
            "title_accent": "اصلاح.",
            "lead_text": "د PMA خپرونو، د منځګړیتوب قوانین، اداري اسناد، څیړنیزې مقالې، د مدافع وکالت سرچینې، او میډیا منځپانګې ته لاسرسی ومومئ کوم چې په پاکستان کې د ADR (د شخړو د بدیل حل) او د شخړو سوله ایز حل ملاتړ کوي."
          },
          "tabs": {
            "featured": "غوره (نمایاں)",
            "downloads": "ډاونلوډونه",
            "mediation_laws": "د منځګړیتوب قوانین",
            "advocacy": "مدافعت (Advocacy)",
            "press_media": "مطبوعات او رسنۍ",
            "articles": "مقالې"
          },
          "downloads_panel": {
            "header": {
              "title": "ډاونلوډونه",
              "lead": "د ډاونلوډ وړ PDFs، فارمونه او خپرونې. په نوي ټب کې د فایل خلاصولو لپاره په هغې کلیک وکړئ.",
              "view_all_text": "ټول ډاونلوډونه کتل"
            },
            "global_labels": {
              "download_btn_text": "پی ډي ایف ډاونلوډ کړئ",
              "default_image_alt": "د ADR-ACT-2017 پی ډي ایف فایل"
            },
            "items": {
              "card_1": {
                "title": "د ADR قانون 2017 (ADR-ACT-2017)",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "مدافعت او لابي (Advocacy and Lobby)",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "د راجستر کولو سند (Certificate)",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "د غړیتوب غوښتنلیک فارم",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "د اتحادیې یادداشت / تګلاره (اپډیټ شوی)",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "نوماندي (Nomination)",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "د PMA وینا (Speech)",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "ولې له PMA سره یوځای شو؟",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "د منځګړیتوب قوانین او قانون جوړونه",
              "lead": "د منځګړیتوب اړوند مهم قوانین، بلونه او رسمي تقنیني اسناد.",
              "view_all_text": "ټول قوانین کتل"
            },
            "global_labels": {
              "download_btn_text": "پی ډي ایف ډاونلوډ کړئ",
              "default_image_alt": "د ADR-ACT-2017 پی ډي ایف فایل"
            },
            "items": {
              "card_1": {
                "title": "د اسلام آباد د شخړو د حل قانون (منځګړیتوب)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "د ۱۹۰۸ کال د ملکي اجراآتو د قانون په لومړي جدول کې تعدیلات",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "د ملکي اجراآتو په قانون ۱۹۰۸ کې د پنجاب تعدیلات (د منځګړیتوب مادې)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "د ملکي اجراآتو د قانون د تعدیل (سندھ) مسوده، ۲۰۱۸",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "د منځګړیتوب له لارې د شخړو په هواري د سنګاپور کنوانسیون (متن)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "مدافعت او تګلاره (Advocacy & Policy)",
              "lead": "د ADR اصلاحاتو د ملاتړ لپاره د پالیسۍ لنډیزونه، د مدافعت اوزار او د دریځ پاڼې.",
              "view_all_text": "ټول مدافعتي مواد کتل"
            },
            "global_labels": {
              "download_btn_text": "پی ډي ایف ډاونلوډ کړئ",
              "default_image_alt": "د ADR-ACT-2017 پی ډي ایف فایل"
            },
            "items": {
              "card_1": {
                "title": "خیبر پښتونخوا (KPK)",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "پنجاب",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "سندھ",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "مطبوعات او رسنۍ",
              "lead": "د خبریالانو لپاره مطبوعاتي اعلامیې، د رسنیو کټونه او د ډاونلوډ وړ توکي.",
              "view_all_text": "ميډيايي مواد کتل"
            },
            "global_labels": {
              "download_btn_text": "پی ډي ایف ډاونلوډ کړئ",
              "default_image_alt": "پی ډي ایف فایل"
            },
            "items": {
              "card_1": {
                "title": "بزنس ريکارډر (Business Recorder)",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "بزنس ريکارډر اعلان (AD)",
                "file_name": ""
              },
              "card_3": {
                "title": "فرنټيئر پوسټ (Frontier Post)",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "پاکستان آبزرور (Pakistan Observer)",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "د PMA مطبوعاتي اعلامیه (Press Release)",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "ټریبیون (Tribune)",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "مقالې او تحلیلونه",
              "lead": "د منځګړیتوب او ADR په اړه څیړنیزې مقالې، تحلیلونه او فکري لیدلوري.",
              "view_all_text": "ټولې مقالې کتل"
            },
            "global_labels": {
              "download_btn_text": "پی ډي ایف ډاونلوډ کړئ",
              "author_prefix": "لیکوال"
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "جواد اې سرواڼه",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "د It Really Happened in Frankfurt پی ډي ایف"
              },
              "card_2": {
                "title": "Mediation Techniques",
                "author": "جواد اې سرواڼه",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "د Mediation Techniques پی ډي ایف"
              }
            }
          },
          "search_bar": {
            "question": "هغه څه چې تاسو یې لبلوئ نه موندل کیږي؟",
            "subtext": "د اړتیا وړ سرچینو ګړندي موندلو لپاره له لټون (سرچ) څخه ګټه واخلئ یا په کټګورۍ کې لټون وکړئ.",
            "placeholder": "سرچینې وپلټئ...",
            "browse_btn_text": "ټولې سرچینې کتل"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "پیښې او پروګرامونه",
            "title": "پروګرامونه او پیښې",
            "lead": "د PMA کنفرانسونو، د منځګړیتوب نوښتونو، ورکشاپونو او مهمو اعلاناتو سره تازه پاتې شئ.",
            "image_alt": "د خدماتو هیرو تصویر"
          },
          "tab_bar": {
            "upcoming_events": "راتلونکي پروګرامونه",
            "past_events": "تیر شوي پروګرامونه",
            "announcements": "اعلانونه"
          },
          "upcoming_panel": {
            "title": "ډیر ژر ماتیږي",
            "lead": "راتلونکي پروګرامونه، کنفرانسونه او ورکشاپونه به دلته لیست شي. ژر بیرته وګورئ."
          },
          "announcements_panel": {
            "title": "ډیر ژر ماتیږي",
            "lead": "مهم اعلانونه به دلته ښکاره شي. زموږ سره پاتې شئ."
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "تیر شوی پروګرام",
                "pill_text": "تصدیق شوی روزنیز پروګرام",
                "view_gallery_btn": "د پروګرام ګالري کتل",
                "about_label": "د پروګرام په اړه",
                "highlights_label": "د روزنې مهم ټکي"
              },
              "card": {
                "title": "شپږم تصدیق شوی د منځګړیتوب روزنیز پروګرام",
                "sub": "د سند عالي محکمه",
                "date": "د 2026 کال د جون له 08 څخه تر 12 پورې",
                "location": "د سند عالي محکمه، کراچۍ"
              },
              "about_paragraphs": [
                "د پاکستان د منځګړو ټولنې (PMA) په بریالیتوب سره د سند په عالي محکمه کې شپږم تصدیق شوی د منځګړیتوب روزنیز پروګرام ترسره کړ.",
                "دغه پروګرام د منځګړیتوب د مهارتونو پر پیاوړتیا، د شخړو د بدیل حل (ADR) د کړنو پر دودولو، او د قانوني متخصصینو او منځګړیتوب مسلکي کسانو ترمنځ د مسلکي وړتیا پر لوړولو تمرکز درلود.",
                "د متقابلو ناستو, عملي تمرینونو او ګډو بحثونو له لارې، ګډونوالو د منځګړیتوب د عصري تخنیکونو او د شخړو د حل اډانو په اړه ارزښتناک معلومات ترلاسه کړل."
              ],
              "highlights": [
                "تصدیق شوي د منځګړیتوب روزنیز سیشنونه",
                "عملي د منځګړیتوب تمرینونه",
                "متقابل ګروپي بحثونه",
                "د شخړو د بدیل حل (ADR) تخنیکونه",
                "د مسلکي وړتیاوو لوړول",
                "د ګډې زده کړې چاپیریال"
              ],
              "meta": {
                "objective_label": "د روزنې موخه",
                "objective_text": "د منځګړیتوب مهارتونو پیاوړتیا او د شخړو د اغیزمن حل لارو چارو دودول.",
                "organized_label": "تنظیم کونکی",
                "organized_text": "د پاکستان د منځګړو ټولنه (PMA)",
                "participants_label": "ګډونوال",
                "participants_text": "قانوني مسلکي کسان، د ADR متخصصین، منځګړي او تر روزنې لاندې ګډونوال.",
                "type_label": "د پروګرام ډول",
                "type_text": "تصدیق شوی روزنیز پروګرام"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "تیر شوی پروګرام",
                "about_label": "د پروګرام په اړه",
                "highlights_label": "د ADR په برخه کې رامنځته شوي مهم پرمختګونه"
              },
              "card": {
                "title": "منځګړیتوب: پر وړاندې تګ لاره (Mediation A Way Forward)",
                "sub": "لومړی ملي منځګړیتوب کنفرانس",
                "date": "7 مارچ، 2015",
                "location": "ماریوټ هوټل، کراچۍ",
                "type": "ملي کنفرانس"
              },
              "about_paragraphs": [
                "PMA په پاکستان کې لومړی سازمان دی چې د بهرنیو روزل شویو او اعتبار لرونکو منځګړو او همدارنګه د نورو مسلکي کسانو استازیتوب کوي چې د ټولنې د موخو د پرمختګ لپاره ورسره یوځای شوي دي. دغه ټولنه په 2013 کې جوړه شوې او یو شمیر فعالیتونه یې په غاړه اخیستي چې پخوا د IFC/نړیوال بانک ګروپ د شخړو د بدیل حل (ADR) پروژې لخوا پلي کیدل.",
                "د دې په پام کې نیولو سره چې په پاکستان کې د قراردادونو د پلي کولو شاخصونه هڅوونکي ندي او دا ډیری کلونه او دروند لګښت غواړي، PMA هوډ لري چې د داسې مداخلو مشري او ملاتړ وکړي چې د دعوا کونکو غاړو ته دا وړتیا ورکړي چې شخړې په دوستانه توګه او د منځګړیتوب پروسې له لارې حل کړي او په خپل وخت د شخړو په حل کې د قضاییه قوې او محکمو د هڅو ملاتړ وکړي."
              ],
              "highlights": [
                "په کراچۍ کې د شخړو د حل د کراچۍ مرکز او په لاهور کې د لاهور د سوداګرۍ او صنایعو خونې د منځګړیتوب مرکز فعالول.",
                "په پاکستان کې د ADR/منځګړیتوب قوانینو کې د اصالحاتو لپاره هڅې کول.",
                "په پاکستان کې د CEDR اعتبار لرونکو منځګړو او ماسټر ټرینرانو شتون.",
                "په پاکستان کې د ADR درسي نصاب چمتو کول.",
                "په پاکستان کې د ADR روزنو پیاوړي کول او وړاندې کول.",
                "د کارپوریټ حکومتولۍ په ګډون د ډیری شخړو د حل لپاره د یوې وسیلې په توګه د ADR پیژندل."
              ],
              "meta": {
                "objective_label": "د کنفرانس موخې",
                "objective_text": "د ADR او منځګړیتوب د موخو پرمخ وړل او په پاکستان کې د منځګړیتوب د بنسټیز کولو لپاره پر پرمختګونو, ننګونو او راتلونکو مداخلو بحث کول.",
                "organized_label": "د کنفرانس کوربانه",
                "organized_text": "د دغه کنفرانس کوربه توب د پاکستان د منځګړو ټولنه د کنفرانس د ملګرو په همکارۍ کوي.",
                "participants_label": "ویناوال او مېلمانه",
                "participants_text": "د حکومت، قضاییه قوې، سوداګریزې ټولنې، بار، اکاډمۍ او په پاکستان کې د منځګړیتوب مرکزونو استازي د بهرنیو ویناوالو سره یوځای.",
                "type_label": "د پروګرام ډول",
                "type_text": "ملي کنفرانس"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "د محرمیت",
            "title_accent": "پالیسي",
            "lead_text": "موږ ستاسو د محرمیت ساتلو او ډاډ ترلاسه کولو ته ژمن یو چې ستاسو شخصي معلومات په خوندي او مسؤلانه ډول اداره شي."
          },
          "sections": {
            "commitment": {
              "title": "د محرمیت ژمنه",
              "paragraphs": [
                "د پاکستان د منځګړو ټولنه (PMA) آنلاین ستاسو د محرمیت ساتلو ته ژمنه ده. د پاکستان د منځګړو ټولنې (PMA) د محرمیت په اړه د خپلې کلکې ژمنې د څرګندولو لپاره د محرمیت دا بیانیه چمتو کړې ده. لاندې متن د پاکستان د منځګړو ټولنې (PMA) لپاره زموږ د معلوماتو راټولولو او خپرولو طریقې په ګوته کوي.",
                "PMA حق لري چې هر وخت کاروونکو ته د نوي محرمیت بیانیې د شتون په اړه د خبر ورکولو له لارې دا پالیسي بدله کړي. دا بیانیه او دلته ذکر شوې پالیسۍ د هیڅ لوري په ګټه یا د هغه لخوا کوم تړون یا نور قانوني حقونه نه رامینځته کوي او نه یې هدف دی."
              ]
            },
            "respect_data": {
              "title": "د کارونکي ډیټا ته درناوی",
              "paragraphs": [
                "د پاکستان د منځګړو ټولنه (PMA) له خپلو پیرودونکو سره قوي اړیکو ته خورا ارزښت ورکوي. په دغه ټولنه (PMA) کې د ډیټا راټولول زموږ د پیرودونکو محرمیت ته په بشپړ او مناسب درناوي سره ترسره کیږي.",
                "کوم معلومات چې موږ یې راټولوو په حساس، خوندي او محرمیت ته په سمه توګه په پام کې نیولو سره اداره کیږي. د پاکستان د منځګړو ټولنه (PMA) هغه معلومات چې موږ یې له خپلو پیرودونکو څخه راټولوو دریمې ډلې ته نه افشا کوي، نه یې ویشي او نه یې پلوري."
              ]
            },
            "collection": {
              "title": "د معلوماتو راټولول",
              "lead_text": "PMA د غړیتوب ثبتولو لپاره داسې معلومات راټولوي لکه:",
              "items": [
                "کمپیوټري ملي شناختي کارت (CNIC)",
                "بشپړ نوم",
                "د اوسیدو پته",
                "د دفتر پته",
                "د تلیفون شمیره",
                "د بریښنالیک معلومات",
                "د غړیتوب اړوند نور معلومات"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "شکایات او اپیل",
            "title_accent": "پالیسي",
            "lead_text": "موږ د اندیښنو او شکایتونو په عادلانه، سمدستي او روڼ ډول حل کولو ته ژمن یو."
          },
          "intro_card": {
            "bold_text": "موږ د شکایتونو د حل لپاره یو منظم طرزالعمل لرو چې دا ډاډ رامنځته کوي چې هغوی ته پوره پاملرنه او پام وشي.",
            "lead_p": "شکایتونه د PMA د منځګړیتوب اعتبار ورکولو خدماتو هر کارونکي لخوا کیدی شي. PMA موخه لري چې ټولو کاروونکو ته ګړندي او پر وخت خدمات وړاندې کړي. موږ به:",
            "commitments": [
              "ټول شکایتونه په جدي توګه واخلو او په سمه توګه به ورسره چلند وکړو؛",
              "شکایتونو ته به په سمدستي توګه رسیدګي وکړو؛ او",
              "له شکایتونو څخه به زده کړه وکړو او د خپلو خدماتو د ښه کولو لپاره به اقدامات وکړو."
            ]
          },
          "steps": [
            {
              "text": "خو په هرصورت، موږ یوازې هغه شکایتونه حل کولی شو چې د روزنې رییس (Director of Training) لخوا د ترلاسه شوي کمزوري پیرودونکي خدمت په اړه اندیښنې راپورته کوي."
            },
            {
              "text": "دا پدې مانا ده چې ستاسو قضیه باید د روزنې رییس ته راجع شي او د پوسټ او بریښنالیک له لارې واستول شي، او کاپي (cc) یې د PMA ولسمشر ته واستول شي."
            },
            {
              "text": "هغه زده کونکی چې د روزنې د رییس په پریکړه راضي نه وي د پریکړې په ردولو کې آزاد دی، په دې حالت کې به دا پریکړه هیڅ لازمي اغیزه ونلري. رییس مکلف دی چې د شکایت د ترلاسه کولو څخه وروسته په 30 ورځو کې دننه ځواب ووایی."
            },
            {
              "text": "که چیرې، په هرصورت، تاسو د خپل شکایت د حل څخه ناخوښه پاتې شئ یا د روزنې د رییس لخوا هیڅ ځواب شتون ونلري، تاسو کولی شئ خپل شکایت د PMA ولسمشر ته راجع کړئ چې ستاسو د شکایت د اوریدو لپاره به دوه کسیزه پوهنځي محکمه (Faculty Tribunal) جوړه کړي."
            },
            {
              "text": "تاسو اړتیا لرئ د خپلې غوښتنې د لاملونو په اړه روښانه او لنډ اوسئ او دا چې تاسو د روزنې د رییس لخوا د بیاکتنې یا عدم اقدام څخه څه ترلاسه کول غواړئ. دوه کسیزه محکمه به تاسو ته د PMA ولسمشر ته د کاپي په لیږلو سره لیک واستوي او په یقیني ډول به د غوښتنې د پورته کیدو څخه وروسته په 30 کاري ورځو کې دننه تاسو ته په لیکلي بڼه ځواب ووایی."
            },
            {
              "text": "که تاسو د خپل شکایت په اړه د دوه کسیزې محکمې لخوا د شوي اقدام یا نه اقدام څخه راضي نه یاست، دا به د کومې ډلې په حقونو اغیزه ونکړي چې د مرستې لپاره د مصرف کونکي محکمې (Consumer Court) ته لاسرسی ومومي، کوم چې اختیارونه د ټولو لپاره خلاص دي."
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "شرایط او",
            "title_accent": "مقررات",
            "lead_text": "مهرباني وکړئ دا شرایط په غور سره ولولئ. زموږ ویب پاڼې او خدماتو ته په لاسرسي او کارولو سره، تاسو موافقه کوئ چې د لاندې شرایطو او مقرراتو اطاعت وکړئ."
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "روزنه (Training)",
              "preview": "ستاسو د بکینګ تصدیق کولو لپاره، ستاسو تادیه باید د کورسونو پیل کیدو څخه دمخه؛ دمخه زموږ دفترونو ته ورسیږي.",
              "body_paragraphs": [
                "که چیرې کاروونکی په تادیه کې ناوخته شي، هغوی ته به په کورسونو کې د ګډون اجازه ورنکړل شي."
              ]
            },
            {
              "id": "refunds",
              "title": "د روزنې د پیسو بیرته ورکول",
              "preview": "موږ پوهیږو چې ژوند پیچلی کیدی شي. که تاسو نور نشئ کولی ګډون وکړئ، مهرباني وکړئ ژر تر ژره موږ سره په 9768-3452-021 اړیکه ونیسئ یا موږ ته په info@pma.org.pk بریښنالیک واستوئ.",
              "body_paragraphs": [
                "موږ خوښ یو چې ستاسو په ځای کې د یو بدیل ګډون کونکي تنظیم کړو، یا د کریډیټ یا د پیسو بیرته ورکولو تنظیم وکړو او موږ به تل ستاسو قضیه په انفرادي توګه په پام کې ونیسو."
              ]
            },
            {
              "id": "membership",
              "title": "د غړیتوب لغوه کول",
              "preview": "د غړیتوب فیس د ځانګړو شرایطو پرته د بیرته ورکولو وړ ندی.",
              "body_paragraphs": [
                "مهرباني وکړئ موږ سره اړیکه ونیسئ که تاسو باور لرئ چې ستاسو شرایط د استثنا لپاره وړ دي. هره قضیه د PMA د غړیتوب کمیټې لخوا په انفرادي ډول بیاکتنه کیږي."
              ]
            },
            {
              "id": "copyright",
              "title": "د کاپي حق (Copyright)",
              "preview": "دا سایټ او د هغې مینځپانګې د کاپي حق تابع دي. د سایټ د موادو کاپي حق د پاکستان د منځګړو ټولنې (PMA) ملکیت دی، یا د ځینو موادو په حالت کې، د دریمې ډلې ملکیت دی. د سایټ د فعالیت او عملیاتو کاپي حق د PMA ملکیت دی.",
              "body_paragraphs": [
                "تاسو کولی شئ دا سایټ او د هغې مینځپانګې د خپل ویب براوزر په کارولو سره وګورئ او په بریښنایی ډول د دې سایټ برخې کاپي او هارډ کاپي چاپ کړئ یوازې د شخصي ، غیر سوداګریز کارونې لپاره. هر ډول بل کارول، په شمول د دې سایټ د مینځپانګې بیا تولید، ترمیم، ویش، لیږد، بیا خپرول، ښودل یا اجرا کول په کلکه منع دي."
              ]
            },
            {
              "id": "disclaimer",
              "title": "ادعا ردول (Disclaimer)",
              "preview": "تاسو موافقه کوئ چې د دې سایټ کارول او لاسرسی د دې شرایطو او ټولو پلي کیدونکو قوانینو تابع دی، او ستاسو په خپل خطر دی. دا سایټ او د هغې مینځپانګې تاسو ته د \"شکل په توګه\" چمتو شوي، سایټ ممکن غلطۍ، نیمګړتیاوې او ناڅرګندتیاوې ولري او ممکن بشپړ او تازه نه وي.",
              "body_paragraphs": [
                "د پاکستان د منځګړو ټولنه (PMA) د دې سایټ د فعالیت یا د معلوماتو، مینځپانګې، موادو یا محصولاتو په اړه چې پدې سایټ کې شامل دي د هر ډول څرګند یا ضمیمه شوي تضمین یا استازیتوب نه کوي، پرته له هغه چې د پلي کیدونکو قوانینو سره سم چمتو شوي وي.",
                "نه PMA، او نه د هغې پورې تړلي کسان، رییسان، افسران، کارمندان، استازي، قراردادیان، ځای ناستي یا ټاکل شوي کسان د هر ډول زیانونو مسؤل دي چې د دې سایټ او پدې سایټ پورې تړلي هر بل سایټ کارولو څخه رامینځته کیږي یا په کوم ډول پورې اړه لري. دا محدودیت په مستقیم، غیر مستقیم، پایله لرونکي، ځانګړي، جزا ورکوونکي یا نورو زیانونو باندې پلي کیږي چې تاسو یا نور ورسره مخ کیدی شي، او همدارنګه د ګټې له لاسه ورکولو، د سوداګرۍ مداخلې یا د ډیټا یا معلوماتو له لاسه ورکولو زیانونو باندې پلي کیږي."
              ]
            },
            {
              "id": "translations",
              "title": "د ګوګل ژباړې (Google Translations)",
              "preview": "دا ویب پاڼه ستاسو د اسانتیا لپاره د Google Translate™ لخوا په کارولو سره ژباړل شوې ده. د Google Translate™ ژباړې د یو اتوماتیک کمپیوټري پروسې لخوا ترسره کیږي، نه د تصدیق شوي مسلکي ژباړونکي لخوا.",
              "body_paragraphs": [
                "د همدې امله، ژباړې ممکن ناسمې یا د اعتماد وړ نه وي. د Google Translate™ ژباړې په احتیاط سره وکاروئ. ژباړې د هر ډول تضمین پرته د \"شکل په توګه\" چمتو شوي. ځینې مینځپانګې (نه لکه عکسونه، ویډیوګانې، فلش او داسې نور) ممکن د ژباړې سافټویر د محدودیتونو له امله ونه ژباړل شي.",
                "PMA د نیمګړتیاوو یا ناسمو ژباړو مسؤلیت نلري، او نه هم د کارونکي لخوا د Google Translate™ ژباړو (یا پدې ویب پاڼه کې د هرې بلې ژباړې) کارولو څخه د رامینځته شوي زیانونو یا زیانونو مسؤل دی.",
                "که تاسو د Google™ Translate په اړه کومه پوښتنه لرئ، لیدنه وکړئ: Google Translate™ FAQs.",
                "ګوګل د ژباړې اړوند ټول تضمینونه ردوي، که څرګند وي یا ضمیمه، په شمول د دقت، اعتبار، او د سوداګریزې وړتیا، د یو ځانګړي هدف لپاره د مناسبوالي او د سرغړونې نشتوالي هر ډول ضمیمه تضمینونه."
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "له PMA سره یوځای شئ",
            "title_main": "شئ یو",
            "title_accent": "د PMA غړی",
            "lead_text": "د منځګړو، د ADR پوهانو او اداري مشرانو له یوې نامتو ټولنې سره یوځای شئ چې د شخړو پرامن حل ته ژمن دي."
          },
          "why_join": {
            "title_main": "ولې له PMA سره",
            "title_accent": "یوځای",
            "title_end": "شئ؟",
            "subtitle": "د PMA غړي د مسلکي ګټو او فرصتونو له یو روښانه لړۍ څخه ګټه پورته کوي.",
            "cards": [
              {
                "title": "نړیوال کنفرانسونه",
                "description": "په منځګړیتوب او بې پرې پریکړو (arbitration) کې د وروستیو مسلو په اړه په نړیوالو کنفرانسونو کې د تخفیف او لومړیتوب لرونکي نوم لیکنې سره ګډون وکړئ."
              },
              {
                "title": "ورکشاپونه او کورسونه",
                "description": "د لوړ کیفیت تعلیمي ورکشاپونو او مسلکي پرمختیا کورسونو ته لاسرسی ومومئ."
              },
              {
                "title": "مسلکي وده",
                "description": "د کارپوهانو د لیدونو او سرچینو له لارې د منځګړیتوب او ADR په اړه خپل پوهاوی زیات کړئ."
              },
              {
                "title": "نړیوال شبکه",
                "description": "ارزښت لرونکي ملي او نړیوال مسلکي اړیکې رامینځته او وساتئ."
              },
              {
                "title": "سوداګریز فرصتونه",
                "description": "د خپلو سوداګریزو او مسلکي پیژندګلو دایره پراخه کړئ."
              },
              {
                "title": "د مسلک ملاتړ کول",
                "description": "د منځګړیتوب او د شخړو د پرامن حل په ملاتړ او پراختیا کې کلیدي رول ولوبوئ."
              }
            ]
          },
          "benefits": {
            "title_main": "د غړیتوب",
            "title_accent": "ګټې",
            "subtitle": "د PMA د راجستر شوي غړي په توګه، تاسو به د پراخو ګټو او فرصتونو څخه برخمن شئ.",
            "items": [
              {
                "title": "د شبکې جوړولو فرصتونه",
                "description": "د کال په اوږدو کې، PMA غړو ته بیلابیل فرصتونه چمتو کوي ترڅو مسلکي اړیکې پیاوړې کړي او د صنعت د فعالیتونو او تمایلاتو څخه خبر پاتې شي."
              },
              {
                "title": "د غړیتوب لارښود (Directory)",
                "description": "په ځانګړې توګه د PMA غړو لپاره شتون لري، دا لارښود د غړو او نورو نړیوالو سازمانونو تازه شوي د اړیکو معلومات لري. په چاپي او بریښنایی بڼه کې شتون لري."
              },
              {
                "title": "د غړیتوب سند (Certificate)",
                "description": "غړو ته د منل کیدو وروسته په نړیواله کچه پیژندل شوی د غړیتوب سند ورکول کیږي. سندونه په کلنۍ غونډه (Members Gala) کې ویشل کیږي."
              },
              {
                "title": "دوامداره مسلکي پرمختګ",
                "description": "په منځګړیتوب او ADR کې د مخکښو کارپوهانو لخوا په انګلیسي او عربي ژبو د ځانګړو ورکشاپونو او مسلکي پرمختیا کورسونو ته لومړیتوب لرونکی لاسرسی."
              }
            ]
          },
          "membership_journey": {
            "title": "د غړیتوب سفر",
            "subtitle": "د PMA د یو ارزښتمن غړي کیدو لپاره یو ساده بهیر.",
            "steps": [
              {
                "num": "1",
                "title": "د غړیتوب فورمه وسپارئ",
                "desc": "آنلاین د غوښتنلیک فورمه ډکه کړئ."
              },
              {
                "num": "2",
                "title": "د پروفایل بیاکتنه",
                "desc": "زموږ ټیم به ستاسو غوښتنلیک وڅیړي."
              },
              {
                "num": "3",
                "title": "د غړیتوب تایید",
                "desc": "کله چې ستاسو غوښتنلیک تایید شي، تاسو ته به خبر درکړل شي."
              },
              {
                "num": "4",
                "title": "PMA ته ښه راغلاست",
                "desc": "د خپل غړیتوب سند ترلاسه کړئ او زموږ د مسلکي شبکې برخه شئ."
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "د غړیتوب غوښتنلیک فورمه",
              "desc": "مهرباني وکړئ دقیق معلومات چمتو کړئ. ټول هغه ځایونه چې د * نښه لري لازمي دي."
            },
            "sections": {
              "personal_info": {
                "title": "شخصي معلومات",
                "fields": {
                  "full_name": { "label": "بشپړ نوم", "placeholder": "خپل بشپړ نوم دننه کړئ" },
                  "father_name": { "label": "د پلار نوم", "placeholder": "د پلار نوم دننه کړئ" },
                  "qualification": { "label": "تعليمي وړتيا", "placeholder": "خپله وړتیا دننه کړئ" },
                  "designation": { "label": "دنده/عهرده", "placeholder": "خپله دنده دننه کړئ" },
                  "cnic": { "label": "د پیژندپاڼې شمیره (CNIC)", "placeholder": "د پیژندپاڼې شمیره دننه کړئ" },
                  "chamber_phone": { "label": "د دفتر/چیمبر فون", "placeholder": "د دفتر تلیفون دننه کړئ" }
                }
              },
              "contact_info": {
                "title": "د اړیکو معلومات",
                "fields": {
                  "office_address": { "label": "د دفتر پته", "placeholder": "د دفتر پته دننه کړئ" },
                  "res_address": { "label": "د اوسیدو پته", "placeholder": "د اوسیدو پته دننه کړئ" },
                  "res_phone": { "label": "د کور تلیفون", "placeholder": "د کور تلیفون شمیره دننه کړئ" },
                  "email": { "label": "بریښنالیک", "placeholder": "خپل بریښنالیک دننه کړئ" },
                  "upload": {
                    "label": "اسناد اپلوډ کړئ",
                    "text": "فایل غوره کړئ یا یې دلته کش کړئ (Drag)",
                    "hint": "PDF, JPG, PNG (تر ټولو زیات 5MB)"
                  }
                }
              },
              "references": {
                "title": "مسلکي حوالې (References)",
                "fields": {
                  "proposer_name": { "label": "د وړاندیز کونکي (Proposer) بشپړ نوم", "placeholder": "د وړاندیز کونکي نوم دننه کړئ" },
                  "proposer_address": { "label": "د وړاندیز کونکي د اوسیدو پته", "placeholder": "پته دننه کړئ" },
                  "proposer_phone": { "label": "د وړاندیز کونکي تلیفون", "placeholder": "د تلیفون شمیره دننه کړئ" },
                  "seconder_name": { "label": "د تایید کونکي (Seconder) بشپړ نوم", "placeholder": "د تایید کونکي نوم دننه کړئ" },
                  "seconder_address": { "label": "د تایید کونکي د اوسیدو پته", "placeholder": "پته دننه کړئ" },
                  "seconder_phone": { "label": "د تایید کونکي تلیفون", "placeholder": "د تلیفون شمیره دننه کړئ" }
                }
              }
            },
            "declaration": "زه په دې توګه اعلان کوم چې پورته ورکړل شوي معلومات ریښتیني او دقیق دي.",
            "submit_btn": "غوښتنلیک وسپارئ",
            "sidebar": {
              "title_main": "د مثبت بدلون",
              "title_accent": "برخه شئ",
              "desc": "له PMA سره یوځای شئ او د خبرو اترو، تفاهم او د شخړو د پرامن حل کلتور په جوړولو کې مرسته وکړئ.",
              "list": [
                "مسلکي پیژندنه",
                "زده کړه او پرمختګ",
                "شبکه جوړول او همکاري",
                "اغیزمنه ونډه اخیستنه"
              ],
              "quote": "یوځای موږ کولی شو د منځګړیتوب له لارې یوه ډیره همغږې او عادله ټولنه رامینځته کړو.",
              "author": "- PMA"
            }
          }
        }
      }
    },
    sd: {
      translation: {
        nav: {
          home: "گھر",
          about: "PMA بابت",
          mediation: "ثالثت",
          services: "خدمتون",
          training: "تربيت",
          leadership: "قيادت",
          resources: "وسيلا",
          events: "تقريبن",
          contact: "اسان سان رابطو",
          membership: "ميمبر ٿي وڃو"
        },
        hero: {
          title_part1: "پرسرار حل کي فروغ",
          title_part2: "گفتگو، سمجھ ۽ احترام ذريعي",
          description1: "اسان ثالثت کي روايتي قانوني نقصان لاء موثر، معقول، خفيہ ۽ تعاون جو بيڪار دي.",
          description2: "منظم گفتگو ۽ پروفيشنل سهولت ذريعي، اسان ماڻهن، خاندانن، ڪاروباري ۽ ادارن کي نزاع حل ڪرڻ ۾ مدد ڪريون ٿا.",
          btn_consult: "مفت صلاح و مشورو جي درخواست ڪريو",
          btn_training: "تربيتي پروگرام ڏسو"
        },
        features: {
          confidential_title: "خفيہ ۽ نجي",
          confidential_desc: "توهان جي گفتگو مڪمل محفوظ رهندي آهي.",
          faster_title: "تيز حل",
          faster_desc: "نزاعات کي مهينن جي بجائے ڏينهن ۽ هفتينن ۾ حل ڪريو.",
          cost_title: "سستو حل",
          cost_desc: "مهنگي قانوني فيس ۽ ڊگهي عدالتي لڙائين کان بچو."
        },
        glance: {
          title: "PMA هڪ نظر ۾",
          founded: "قائم 2013–14",
          founded_label: "پاڪستان جي پھريون ثالثت انجمن",
          mediations: "2000+",
          mediations_label: "ڪامياب ثالثت ۽ سهولت ڪيسز",
          mediators: "100+",
          mediators_label: "تصديق شدہ ثالث پاڪستان ڀر",
          training: "100+",
          training_label: "تربيتي پروگرام فراهم ڪيا ويا",
          impact: "ملي اثر",
          impact_label: "ADR شعور ۽ پاليسي اصلاح"
        },
        about: {
          years: "سال",
          stat_label: "ثالثت جي بھترين کي فروغ",
          tab1_title: "PMA بابت",
          tab1_text: "PMA (پاڪستان ثالثن جي انجمن) هڪ آزاد ادارو آهي جو پاڪستان ڀر ثالثت ۽ متبادل نزاع حل (ADR) ذريعي پرسرار حل کي فروغ ڏيڻ لاء قائم ڪيو ويو آهي.",
          tab2_title: "اسان جو نظريو",
          tab2_text: "ثالثت کي پاڪستان ۾ نزاع حل کے اهم ۽ قابل اعتماد طريقو بڻائڻ.",
          tab3_title: "اسان جو مشن",
          tab3_mission1: "ثالثت کي رسائي پذير ۽ موثر نزاع حل ميکانزم لاء فروغ ڏيڻ",
          tab3_mission2: "بين الاقوامي معيارن جي مطابق ثالثن کي تربيت ۽ تسليم ڪرڻ",
          tab3_mission3: "عدالتن، حڪومتي ادارن ۽ نجي شعبن سان تعاون",
          tab3_mission4: "ثالثت جي فوائد بابت معاشري ۾ شعور وڌائڻ",
          tab4_title: "اسان جو اثر",
          tab4_text1: "PMA ڪاميابيء سان سيڪڙن وڪيلن، ججن ۽ پروفيشنلن کي تربيت ڏني آهي.",
          tab4_text2: "اسان عدالت ۽ اسٹيڪ هولڈرز سان ملي ثالثت کي پائيدار نزاع حل نظام لاء مضبوط ڪرڻ ۾ ڪم ڪري ٿا.",
          info_phone_label: "اسان جي خدمتون درڪار آهن؟",
          info_phone_val: "ڪال ڪريو: +92 300 000 0000",
          info_hours_label: "ڪم جي وقت",
          info_hours_val: "سوموار-جمعو (9 صبح تي 5 شام)",
          info_email_label: "اسان کي ای میل ڪريو",
          info_email_val: "info@pma.org.pk"
        },
        mediation: {
          title: "ميڊئيشن (مصالحت) ڇا آهي؟",
          text1: "ميڊئيشن هڪ رضاکارانه، رازدارانه ۽ منظم عمل آهي جتي هڪ غير جانبدار ثالث ڌرين کي ڳالهين ڪرڻ، هڪ ٻئي جي نقطي نظر کي سمجهڻ ۽ باهمي طور قبول جوڳي حل تائين پهچڻ ۾ مدد ڪري ٿو.",
          text2: "اهو ڌرين کي نتيجا طئي ڪرڻ جو اختيار ڏئي ٿو، لاڳاپا برقرار رکي ٿو ۽ وقت، خرچ ۽ ذهني دٻاءُ کي بچائي ٿو.",
          btn: "ميڊئيشن جو عمل سمجهو"
        },
        why_choose: {
          title: "توهان <span class='pma-about-heading-accent'>PMA</span> جو انتخاب ڇو ڪريو؟",
          lead: "اسان اخلاقي، مؤثر، ۽ پائيدار ADR حل فراهم ڪرڻ لاءِ مقامي سمجهو سان گڏ بين الاقوامي معيارن کي گڏ ڪريون ٿا.",
          btn: "PMA بابت وڌيڪ ڄاڻو",
          features: {
            f1_title: "بين الاقوامي معيار",
            f1_desc: "اسان عالمي سطح تي تسليم ٿيل مصالحت جي اصولن ۽ طريقن تي عمل ڪريون ٿا.",
            f2_title: "تجربيڪار ۽ تصديق ٿيل ثالث",
            f2_desc: "اسان جي پينل ۾ اعليٰ تربيت يافته ۽ مڃيل پروفيشنل شامل آهن.",
            f3_title: "خفيو (پوشيدو) عمل",
            f3_desc: "هر مرحلي تي توهان جي رازداري اسان جي پهرين ترجيح آهي.",
            f4_title: "تيز ۽ خوشگوار نتيجا",
            f4_desc: "اسان تڪرارن کي ڪارگر ۽ مؤثر طريقي سان حل ڪرڻ ۾ مدد ڪريون ٿا.",
            f5_title: "خرچ ۾ بچت (ڪفايتي)",
            f5_desc: "مهانگي ۽ طويل قانوني ڪارروائيءَ جو هڪ عملي متبادل."
          }
        },
        training: {
          title_part1: "پروفيشنل تربيت ۽",
          title_part2: "توثيق (Accreditation)",
          text: "PMA بين الاقوامي معيارن جي مطابق مصالحت جي تربيت ۽ پروفيشنل ڊيولپمينٽ پروگرام فراهم ڪري ٿي جيڪي وڪيلن، ڪارپوريٽ پيشيور ماڻهن، HR ٽيمن، استادن، ۽ ثالث بڻجڻ جي خواهش رکندڙن لاءِ تيار ڪيا ويا آهن. اسان جا ورڪشاپ ۽ سرٽيفڪيشن پروگرام تڪرارن جي عملي حل جي مهارتن، ڳالهه ٻولهه جي حڪمت عملين، رابطي ۽ ADR فريم ورڪ تي ڌيان ڏين ٿا.",
          features: {
            feat1: "IMI توثيق (Accreditation)",
            feat2: "ماهر ٽرينرز",
            feat3: "عملي سکيا",
            feat4: "عالمهي معيار"
          },
          card_text: "اسان جا تربيتي پروگرام بين الاقوامي معيارن تي پورو لهن ٿا ۽ پيشيور ماڻهن کي مؤثر، اخلاقي، ۽ عالمي سطح تي قابل ثالث (Mediators) بڻجڻ لاءِ بااختيار بڻائين ٿا.",
          btn_text: "تربيت جا پروگرام دريافت ڪريو"
        },
        services: {
          title: "اسان جون بنيادي خدمتون",
          list: {
            s1: { title: "ڪمرشل ۽ ڪارپوريٽ ميڊئيشن", desc: "ڪاروباري ۽ تجارتي تڪرارن جو حل." },
            s2: { title: "عدالتي ميڊئيشن", desc: "عدالت سان لاڳاپيل معاملن لاءِ ADR سپورٽ." },
            s3: { title: "خانداني ۽ ڪميونٽي ميڊئيشن", desc: "خانداني تڪرارن جو پرامن حل." },
            s4: { title: "ڪم جي جڳهه جا تڪرار", desc: "آفيس جي اندروني معاملن کي حل ڪرڻ." },
            s5: { title: "IMI-تصديق ٿيل ميڊئيٽر ٽريننگ", desc: "پيشيوراڻي سرٽيفڪيشن پروگرام." },
            s6: { title: "ورڪشاپس ۽ شعور", desc: "ADR بابت ڄاڻ ڏيندڙ سيمينار." },
            s7: { title: "اداراتي مشورتي خدمتون", desc: "ADR سسٽم ٺاهڻ ۾ ادارن جي مدد." }
          }
        },
        leadership: {
          title: "اسان جي قيادت سان ملو",
          roles: { president: "صدر", secretary: "سيڪريٽري جنرل", vp_north: "نائب صدر - اتر", ec_north: "ايگزيكٽو ڪميٽي - اتر" }
        },
        stats: {
          s1: { label: "ڪامياب ميڊئيشنز", unit: "+" },
          s2: { label: "ڪامياب حل", unit: "%" },
          s3: { label: "100% ذاتي عمل", value: "رازدارانه" },
          s4: { label: "تربيت يافته ميڊئيٽرز", value: "مستند" }
        },
        partners: {
          title: "اسان جا پارٽنرز",
          p1: "سنڌ هاءِ ڪورٽ",
          p2: "سرڪاري ادارا",
          p3: "انٽرنيشنل ميڊئيشن انسٽيٽيوٽ"
        },
        cta: {
          title: "اچو ته ڳالهايون، ڇو ته اسان ڪري سگهون ٿا.",
          subtitle: "ڇا توهان تڪرار پرامن طريقي سان حل ڪرڻ چاهيو ٿا؟ يا مستند ثالث بڻجڻ چاهيو ٿا؟ اڄ ئي رابطو ڪريو",
          btn1: "مفت صلاح مشورو",
          btn2: "مستند ثالث بڻجو",
          link: "اسان جي ٽيم سان فوري چيٽ ڪريو"
        },
        footer: {
          brand: {
            tagline: "پاڪستان ۾ ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي پرامن حل کي هٿي ڏيڻ.",
            logo_alt: "پاڪستان ميڊئيٽرز ايسوسيئيشن"
          },
          quick_links: {
            title: "فوري لنڪس",
            items: [
              { label: "گهر", link: "index.html" },
              { label: "PMA بابت", link: "about.html" },
              { label: "ميڊئيشن (مصالحت)", link: "mediation.html" },
              { label: "خدمتون", link: "services.html" },
              { label: "تربيت", link: "training.html" },
              { label: "قيادت", link: "leadership.html" },
              { label: "وسائل", link: "resources.html" },
              { label: "ايونٽس", link: "events.html" },
              { label: "رابطو ڪريو", link: "contact.html" }
            ]
          },
          services: {
            title: "اسان جون خدمتون",
            items: [
              "ميڊئيشن جون خدمتون",
              "IMI کان تصديق ٿيل ميڊئيٽر ٽريننگ",
              "ADR ورڪشاپس ۽ شعور اجاگر ڪرڻ جا سيشن",
              "اداراتي ADR مشورتي خدمتون",
              "پاليسي ۽ ميڊئيشن ايڊووڪيسي"
            ]
          },
          contact: {
            title: "رابطي جي معلومات",
            hours: "سومر کان جمعو (صبح 9 کان شام 5 وڳي تائين)",
            address: "253, P.E.C.H.S., Block-6, Off Shahrah-e-Faisal, Karachi 75400, Pakistan",
            email: "info@pma.org.pk",
            phone: "+92 21 0000 0000"
          },
          bar: {
            copyright: "© 2026 پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA). سڀ حق محفوظ آهن.",
            legal: [
              { label: "اڪثر پڇيا ويندڙ سوال (FAQ's)", link: "faq.html" },
              { label: "پرائيويسي پاليسي", link: "privacy-policy.html" },
              { label: "شڪايت ۽ اپيل پاليسي", link: "complaint-policy.html" },
              { label: "شرطون ۽ ضابطا", link: "terms.html" }
            ]
          }
        },
        "about-page": {
          hero: {
            img_alt: "PMA بابت",
            eyebrow: "PMA بابت",
            title_part1: "هڪ اهڙي ثقافت جي تعمير",
            title_part2: "ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي",
            lead: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) پروفيشنل تربيت، اداراتي تعاون، ۽ بين الاقوامي سطح تي تسليم ٿيل معيارن جي ذريعي پوري پاڪستان ۾ ميڊئيشن (مصالحت) ۽ متبادل تڪرارن جي حل (ADR) کي هٿي ڏيڻ لاءِ پرعزم آهي."
          },
          about: {
            hero_img_alt: "PMA بابت",
            hero_eyebrow: "PMA بابت",
            hero_title_part1: "هڪ اهڙي ثقافت جي تعمير",
            hero_title_part2: "ڳالهين، مصالحت ۽ باهمي افهام و تفهيم جي ذريعي",
            hero_lead: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) پروفيشنل تربيت، اداراتي تعاون، ۽ بين الاقوامي سطح تي تسليم ٿيل معيارن جي ذريعي پوري پاڪستان ۾ ميڊئيشن (مصالحت) ۽ متبادل تڪرارن جي حل (ADR) کي هٿي ڏيڻ لاءِ پرعزم آهي .",
            badge_years: "سال",
            badge_stat_label: "مصالحتي مهارت کي <br>هٿي ڏيڻ",
            nav_tab1: "PMA بابت",
            nav_tab2: "اسان جو ويزن",
            nav_tab3: "اسان جو مشن",
            nav_tab4: "اسان جو اثر",
            tab1_title1: "PMA",
            tab1_title2: "بابت",
            tab1_text: "PMA 2013 ۾ قائم ٿي ۽ پاڪستان حڪومت سان رجسٽرڊ آهي، PMA اهو پروفيشنل ادارو آهي جنهن کي سينٽر فار ايفيڪٽو ڊسپيوٽ ريزوليوشن (CEDR)، برطانيه پاران پاڪستان ۾ CEDR ماڊل جي مصالحتي تربيت فراهم ڪرڻ جو اختيار ڏنو ويو آهي.<br><br>PMA ٿائيلينڊ آربيٽريشن سينٽر (2018) سان هڪ مفاهمتي ياداشت تي دستخط ڪيا آهن ۽ ٻين سارڪ ملڪن جي ادارن سان مضبوط لاڳاپا برقرار رکيا آهن.<br><br>اسان جي ايسوسيئيشن بين الاقوامي سطح تي تسليم ٿيل CEDR مان تربيت يافته ماسٽر ٽرينرز ۽ مصالحت ڪندڙن تي مشتمل آهي، جن سنڌ، پنجاب ۽ اسلام آباد ۾ ججن ۽ وڪيلن لاءِ ڪيترائي تربيتي پروگرام ڪاميابيءَ سان هلايا آهن، جنهن سان ملڪ ۾ مصالحت جا پروفيشنل معيار بلند ٿيا آهن.",
            tab2_title1: "اسان جو",
            tab2_title2: "ويزن",
            tab2_text: "پاڪستان ۾ تڪرارن جي حل جي سڀ کان نمايان ۽ معتبر طريقي جي طور تي مصالحت (Mediation) کي قائم ڪرڻ، تعميري ڳالهين، باهمي افهام و تفهيم ۽ پرامن گڏيل بقا جي ثقافت کي هٿي ڏيڻ.",
            tab3_title1: "اسان جو",
            tab3_title2: "مشن",
            tab3_points: [
              "مصالحت کي تڪرارن جي حل جي هڪ آسان ۽ مؤثر طريقي جي طور تي هٿي ڏيڻ",
              "بين الاقوامي معيارن جي مطابق مصالحت ڪندڙن (Mediators) کي تربيت ڏيڻ ۽ انهن جي تصديق ڪرڻ",
              "عدالتن، حڪومتي ادارن ۽ نجي شعبن سان تعاون ڪرڻ",
              "پوري معاشري ۾ مصالحت جي فائدن بابت آگاهي پيدا ڪرڻ"
            ],
            tab4_title1: "اسان جو",
            tab4_title2: "اثر",
            tab4_text1: "PMA سوين وڪيلن، ججن ۽ پروفيشنلز کي ڪاميابيءَ سان تربيت ڏني آهي ۽ پاڪستان ۾ عدالتن سان لاڳاپيل مصالحتي قدمن کي هٿي ڏيڻ ۾ اهم ڪردار ادا ڪيو آهي.",
            tab4_text2: "اسان مصالحت کي هڪ پائيدار تڪرارن جي حل جي نظام جي طور تي مضبوط ڪرڻ لاءِ عدليه ۽ اسٽيڪ هولڊرز سان گڏجي ڪم جاري رکيو پيا اچون."
          },
          leadership: {
            title1: "قيادت",
            title2: "پيغام",
            president: {
              name: "آغا ظفر احمد",
              role1: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان",
              role2: "صدر",
              role3: "پاڪستان ميڊئيٽرز ايسوسيئيشن",
              heading: "صدر جو پيغام",
              quote: "مصالحت صرف هڪ پروفيشنل اوزار ناهي، پر هڪ ترقي پذير قانوني نظام لاءِ هڪ ضرورت آهي.",
              lead: "جيئن جيئن قانوني ۽ تجارتي ماحول تبديل ٿي رهيو آهي، تيئن تيز، منصفاڻي ۽ اثرائتي انصاف کي يقيني بڻائڻ ۾ ADR جو ڪردار ڪڏهن به ايترو اهم ناهي رهيو. صدر جي حيثيت ۾ منهنجو ڌيان اسان جي پهچ کي وڌائڻ آهي، ته جيئن مصالحت اسان جي قانوني نظام جو بنيادي پٿر بڻجي وڃي.",
              read_more: "پورو پيغام پڙهو",
              sign_role: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان<br>صدر، پاڪستان ميڊئيٽرز ايسوسيئيشن",
              popup: {
                p1: "پاڪستان ميڊئيٽرز ايسوسيئيشن (PMA) جي صدر جي حيثيت سان خدمتون سرانجام ڏيڻ هڪ وڏو اعزاز آهي. جيئن ته قانوني ۽ تجارتي ماحول تبديل ٿي رهيو آهي، متبادل تڪرارن جي حل (ADR) جو ڪردار تيز، منصفاڻي ۽ اثرائتي انصاف کي يقيني بڻائڻ ۾ ڪڏهن به ايترو اهم ناهي رهيو.",
                p2: "هن ايسوسيئيشن جي هڪ باني ميمبر جي حيثيت سان منهنجو سفر ان يقين سان رهيو آهي ته مصالحت صرف هڪ پروفيشنل اوزار ناهي، پر هڪ ترقي پذير قانوني نظام لاءِ هڪ ضرورت آهي. جڏهن اسان مستقبل ڏانهن ڏسون ٿا، منهنجو عزم اهو آهي ته اسان جي ايسوسيئيشن کي هڪ وڌيڪ متحرڪ ۽ تعاون وارو پليٽ فارم بڻايو وڃي، جيڪو روايتي عدالتن ۽ جديد تڪرارن جي حل جي وچ ۾ هڪ پل جو ڪردار ادا ڪري.",
                p3: "اسان جي شروعات کان وٺي، PMA پوري پاڪستان ۾ مصالحت جي عمل کي فروغ ڏيڻ ۽ منظم ڪرڻ لاءِ وقف آهي. اسان پروفيشنل اخلاقيات جي اعليٰ معيارن کي برقرار رکڻ ۽ سڄي ملڪ جي مصالحت ڪندڙن لاءِ هڪ گڏيل آواز مهيا ڪرڻ جي ڪوشش ڪندا آهيون. صدر جي حيثيت ۾ منهنجو مقصد اسان جي پهچ کي وڌائڻ آهي، انهي ڳالهه کي يقيني بڻائڻ ته مصالحت اسان جي قانوني نظام جو هڪ بنيادي حصو بڻجي وڃي، جنهن کي عدليه ۽ عوام ٻئي سماجي ۽ اقتصادي هم آهنگي لاءِ هڪ اهم اوزار طور تسليم ڪن.",
                commit_heading: "اسان ان لاءِ پرعزم آهيون:",
                commit_list: [
                  "<strong>صلاحيتن جي اڏاوت ۽ پروفيشنل ترقي:</strong> مصالحت ڪندڙن لاءِ اعليٰ معيار جي تربيت ۽ تصديق کي جاري رکڻ ته جيئن عالمي معيار جي عمل کي يقيني بڻائي سگهجي ۽ اسان جي ميمبرن جي مهارتن کي انڊسٽري ۾ سڀ کان اڳتي رکيو وڃي.",
                  "<strong>وکالت (Advocacy):</strong> اسٽيڪ هولڊرز ۽ عدليه سان گڏجي ڪم ڪرڻ ته جيئن مصالحت کي بنيادي قانوني فريم ورڪ جو حصو بڻائي سگهجي.",
                  "<strong>جدت (Innovation):</strong> تجارتي، سامونڊي ۽ ڪاروباري تڪرارن کي مؤثر طريقي سان حل ڪرڻ لاءِ جديد طريقن ۽ عالمي بهترين عملن کي اپنائڻ.",
                  "<strong>قومي ڪنوينشن:</strong> اسان سڄي ملڪ ۾ تجربا شيئر ڪرڻ، ڪاميابين جو جشن ملهائڻ، ۽ پنهنجي گڏيل آواز کي مضبوط ڪرڻ لاءِ باقاعدي گڏجاڻيون منظم ڪرڻ جي ڪوشش ڪنداسين.",
                  "<strong>بهترين هماهنگي:</strong> اسان سڀني ميمبرن جي وچ ۾ رابطي ۽ مصروفيت کي بهتر بڻائڻ لاءِ وقف آهيون ته جيئن هر نقطه نظر کي ٻڌو ۽ اهميت ڏني وڃي.",
                  "<strong>ميمبرشپ ۾ واڌارو:</strong> اسان پاڪستان جي قانوني ۽ ڪاروباري برادرين ۾ مصالحت جي پهچ ۽ اثر کي وڌائڻ لاءِ نون پروفيشنلز کي دل سان ڀليڪار ڪنداسين.",
                  "<strong>مصالحت ڪندڙن لاءِ اخلاقي ضابطو (Code of Conduct):</strong> ان کان علاوه، هن مدت جي هڪ اهم ترجيح پاڪستان بار ڪائونسل ۽ صوبائي بار ڪائونسلن سان هماهنگي لاءِ هڪ نئين ڪميٽي قائم ڪرڻ آهي. هي قدم مصالحت ڪندڙن لاءِ هڪ مضبوط اخلاقي ضابطي کي باقاعدي بڻائڻ تي ڌيان ڏيندو، انهي ڳالهه کي يقيني بڻائڻ ته اسان جو عمل اعليٰ اخلاقي ۽ پروفيشنل معيارن تي قائم رهي."
                ],
                closing: "مان توهان سڀني کي دعوت ڏيان ٿو ته اسان سان گڏ هن مشن ۾ شامل ٿيو ته جيئن مصالحت کي عام ڪيو وڃي ۽ پاڪستان ۾ هم آهنگي ۽ پروفيشنل مهارت جي ثقافت کي هٿي ڏني وڃي."
              }
            },
            founding_president: {
              name: "انور ڪاشف ممتاز",
              role1: "ايڊووڪيٽ سپريم ڪورٽ آف پاڪستان",
              role2: "تصديق ٿيل مصالحت ڪندڙ (Accredited Mediator)",
              heading: "باني صدر جو پيغام",
              quote: "گڏجي، اسان هڪ اهڙي ثقافت تعمير ڪري سگهون ٿا جتي جهڳڙي جي ڀيٽ ۾ افهام و تفهيم کي فوقيت حاصل هجي.",
              lead: "اسان جو مشن اسان جي پياري ملڪ ۾ تڪرارن جي حل لاءِ مصالحت کي هڪ اخلاقي، اثرائتي ۽ آسان طريقي جي طور تي فروغ ڏيڻ آهي.",
              read_more: "پورو پيغام پڙهو",
              sign_role: "ايڊووڪيٽ سپريم ڪورٽ<br>تصديق ٿيل مصالحت ڪندڙ",
              popup: {
                p1: "اڄ، پاڪستان ميڊئيٽرز ايسوسيئيشن جي باني صدر جي حيثيت سان، مان هڪ اهڙي پليٽ فارم جي ترقيءَ کي ڏسي ڏاڍو خوش ٿيو آهيان جيڪو ڳالهين ۽ پرامن تڪرارن جي حل لاءِ وقف آهي. اسان جو مشن اسان جي پياري ملڪ ۾ تڪرارن جي حل لاءِ مصالحت کي هڪ اخلاقي ۽ آسان طريقي جي طور تي فروغ ڏيڻ آهي. اسان اعليٰ پروفيشنل معيارن کي برقرار رکڻ ۽ متبادل تڪرارن جي حل جي طريقن تي اعتماد وڌائڻ لاءِ پرعزم آهيون.",
                p2: "تعاون، تربيت ۽ مسلسل سکيا جي ذريعي، اسان جو مقصد سڄي ملڪ ۾ مصالحت ڪندڙن جي صلاحيتن کي مضبوط ڪرڻ آهي.",
                p3: "مان سڀني اسٽيڪ هولڊرز کي حوصلا افزائي ڪريان ٿو ته اهي مصالحت کي عدالتن جي مدد ۽ انصاف ۽ هم آهنگي جي هڪ تعميري رستي طور اپنائين.",
                closing: "گڏجي، اسان هڪ اهڙي ثقافت تعمير ڪري سگهون ٿا جتي جهڳڙي جي ڀيٽ ۾ افهام و تفهيم کي فوقيت حاصل هجي."
              }
            },
            stats: {
              s1_title: "سوين تربيت يافته",
              s1_text: "پوري پاڪستان ۾ وڪيلن، ججن ۽ پروفيشنلز کي تربيت ڏني وئي.",
              s2_title: "عدالتن سان لاڳاپيل مصالحت",
              s2_text: "سڄي ملڪ ۾ مصالحت جي قدمن کي فروغ ڏيڻ ۽ مضبوط ڪرڻ.",
              s3_title: "مضبوط تعاون",
              "s3_text": "تڪرارن جي حل جي هڪ پائيدار نظام لاءِ عدليه ۽ اسٽيڪ هولڊرز سان گڏجي ڪم ڪرڻ."
            }
          },
          partners: {
            title: "اسان جا پارٽنرز",
            p1: "سنڌ هاءِ ڪورٽ",
            p2: "سرڪاري ادارا",
            p3: "انٽرنيشنل ميڊئيشن انسٽيٽيوٽ"
          }
        }, "mediation-page": {
          hero: {
            img_alt: "مصالحتي مشورتي ڪمرو",
            eyebrow: "مصالحت (Mediation)",
            title_part1: "تڪرارن جو حل ڳوليو",
            title_part2: "ڳالهين ۽ باهمي افهام و تفهيم جي ذريعي",
            lead: "مصالحت هڪ رضاڪارانه، بااعتماد ۽ منظم عمل آهي جتي هڪ غير جانبدار ثالث ڌرين کي باهمي طور تي قابل قبول ۽ پائيدار حل تائين پهچڻ ۾ مدد ڪندو آهي."
          },
          mediation: {
            title1: "مصالحت (Mediation)",
            title2: "ڇا آهي؟",
            text1: "مصالحت هڪ رضاڪارانه، بااعتماد ۽ منظم عمل آهي جنهن ۾ هڪ غير جانبدار ۽ بي لوث ٽيون ڌر — يعني ثالث (Mediator) — تڪراري ڌرين جي وچ ۾ ڳالهه ٻولهه کي آسان بڻائيندو آهي ته جيئن اهي باهمي طور تي قابل قبول ۽ پائيدار حل تائين پهچي سگهن.",
            text2: "عدالتي ڪارروائي (Litigation) جي برعڪس، مصالحت باهمي تعاون، پنهنجي مرضي، ۽ تعميري طريقي سان مسئلن کي حل ڪرڻ تي زور ڏئي ٿي. هي ڌرين کي پاڻ ۾ لاڳاپا برقرار رکڻ سان گڏوگڏ تيزيءَ سان ۽ انتهائي گهٽ خرچ ۾ نتيجا حاصل ڪرڻ جي قابل بڻائي ٿي.",
            img_alt: "مصالحت ڇا آهي"
          }, whyChoose: {
            heading_part1: "PMA سان",
            heading_part2: "مصالحت",
            heading_part3: "ڇو چونڊيو؟",
            cards: {
              card1: {
                title: "تيز تر ۽ انتهائي گهٽ خرچ",
                desc: "برسن جي بدران چند هفتن ۾ تڪرارن جو حل ماڻيو."
              },
              card2: {
                title: "مڪمل رازداري",
                desc: "بغير ڪنهن عوامي رڪارڊ جي هڪ نجي ۽ محفوظ عمل."
              },
              card3: {
                title: "لاڳاپن کي برقرار رکڻ",
                desc: "باهمني افهام و تفهيم ۽ ٻنهي ڌرين جي ڪاميابيءَ (win-win) تي ڌيان."
              },
              card4: {
                title: "لچڪدار ۽ باهمي تعاون",
                desc: "نتيجڻ ۽ فيصلن تي ڌرين جو پنهنجو مڪمل اختيار."
              },
              card5: {
                title: "IMI پاران تصديق ٿيل معيار",
                desc: "ثالثن (Mediators) لاءِ بين الاقوامي سطح تي تسليم ٿيل اسناد."
              }
            }
          },
          banner: {
            text: "PMA ثالثي جي توثيق، پروفيشنل تربيت، ۽ وکالت لاءِ پاڪستان جي <strong>پهرين ۽ سڀ کان پراڻي</strong> سرشار تنظيم آهي — جيڪا <strong>2013–2014 ۾ قائم ٿي</strong> ۽ ڪراچي ۾ ٻڌل آهي."
          },
          how_it_works: {
            title_part1: "مصالحت ڪيئن",
            title_part2: "ڪم ڪندي آهي؟",
            img_alt: "مصالحت جو عمل",
            steps: {
              step1: {
                num: "۱",
                title: "پنهنجي درخواست جمع ڪرايو",
                desc: "توهان پنهنجي تڪرار جي تفصيلن کي شيئر ڪرڻ لاءِ PMA سان رابطو ڪريو ٿا."
              },
              step2: {
                num: "۲",
                title: "ڪيس جو ابتدائي جائزو",
                desc: "اسان معاملي جو جائزو وٺون ٿا ۽ مصالحت لاءِ ان جي موزونيت جو تعين ڪريون ٿا."
              },
              step3: {
                num: "۳",
                title: "ثالث (Mediator) جو تعين",
                desc: "توهان جي ڪيس لاءِ هڪ غير جانبدار ۽ اهل ثالث مقرر ڪيو ويندو آهي."
              },
              step4: {
                num: "۴",
                title: "سهولتي سيزنز (Sessions)",
                desc: "ثالث حل ڳولڻ لاءِ منظم ۽ تعميري ڳالهه ٻولهه جي سهولت فراهم ڪندو آهي."
              },
              step5: {
                num: "۵",
                title: "تصفيو ۽ معاهدو",
                desc: "ڌريون هڪ باهمي طور تي قابل قبول نتيجي تي پهچن ٿيون ۽ معاهدي کي رسمي شڪل ڏين ٿيون."
              }
            }
          },
          who_we_serve: {
            title_part1: "اسان ڪنهن کي",
            title_part2: "خدمتون فراهم ڪيون ٿا",
            cards: {
              card1: {
                title: "افراد ۽ خاندان",
                desc: "فرد ن ۽ خاندانن کي سندن ذاتي ۽ ديواني (civil) تڪرارن کي حل ڪرڻ ۾ مدد ڪرڻ."
              },
              card2: {
                title: "کاروبار ۽ ڪارپوريشنون",
                desc: "تجارتي ۽ ڪم واري جڳهه جي تڪرارن کي حل ڪرڻ ۾ کاروباري ادارن جي مدد ڪرڻ."
              },
              card3: {
                title: "سرڪاري ادارا",
                desc: "پبلڪ سيڪٽر جي تڪرارن کي حل ڪرڻ ۾ سرڪاري کاتن جي مدد ڪرڻ."
              },
              card4: {
                title: "اين جي اوز ۽ ڪميونٽي تنظيمون",
                desc: "ڪميونٽي ۽ سماجي تنظيمن لاءِ تڪرارن جي حل کي آسان بڻائڻ."
              },
              card5: {
                title: "لا فرمز ۽ قانوني ماهر",
                desc: "مؤثر ADR حلن لاءِ قانوني ماهرن سان ڀاڱيوالي (شراڪت داري) ڪرڻ."
              }
            }
          },
          cta: {
            title_part1: "اچو ته تڪرارن جو حل ڳوليون",
            title_part2: "امن امان سان.",
            subtitle: "مصالحت باهمي افهام و تفهيم پيدا ڪندي آهي. افهام و تفهيم مان حل نڪرندا آهن. اڄ ئي PMA سان رابطو ڪريو ته جيئن معلوم ٿئي ته مصالحت توهان جي ڪيئن مدد ڪري سگهي ٿي.",
            btn_text: "اڄ ئي اسان سان رابطو ڪريو"
          }
        },
        "services-page": {
          hero: {
            img_alt: "خدمات جو هيرو ايميج",
            eyebrow: "اسان جون خدمتون",
            title_part1: "پروفيشنل مصالحت ۽",
            title_part2: "ADR خدمتون",
            lead: "PMA مصالحت، تربيت، ۽ مشاورتی خدمتن جو هڪ وسيع دائرو فراهم ڪري ٿي ته جيئن فردن، تنظيمن ۽ ادارن کي تڪرارن کي مؤثر طريقي سان حل ڪرڻ ۽ باهمي ڳالهه ٻولهه جي ثقافت کي هٿي وٺرائڻ ۾ مدد ملي سگهي."
          },
          work_with: {
            title_part1: "اسان ڪنهن سان",
            title_part2: "ڪام",
            title_part3: "ڪنداسين",
            items: {
              item1: "لا فرمز ۽ قانوني ماهر",
              item2: "ڪارپوريشنون ۽ ڪاروباري اڳواڻ",
              item3: "سرڪاري ادارا",
              item4: "اين جي اوز ۽ ڪميونٽي تنظيمون",
              item5: "تعليمي ادارا",
              item6: "عدليه ۽ پبلڪ سيڪٽر"
            }
          },
          services_cta: {
            title_part1: "اچو ته گڏجي بهتر حل جو",
            title_part2: "نظام تيار ڪريون.",
            subtitle: "توهان جي ضرورتن جي مطابق مصالحت جي خدمتن، پروفيشنل تربيت، ۽ مشاورتی حلن لاءِ PMA سان ڀاڱيوالي ڪريو.",
            btn_text: "رابطو ڪريو"
          }
        },
        "contact-page": {
          hero: {
            img_alt: "رابطو صفحي جو هيرو ايميج",
            eyebrow: "اسان سان رابطو ڪريو",
            title_part1: "اسان توهان جي مدد لاءِ",
            title_part2: "موجود آهيون.",
            lead: "خواهه توهان جو ڪو سوال هجي، رهنمائي جي ضرورت هجي، يا ڀاڱيوالي ڪرڻ چاهيو، اسان جي ٽيم توهان جي مدد لاءِ تيار آهي. اسان سان رابطو ڪريو ۽ اسان جلد کان جلد توهان کي جواب ڏينداسين.",
            features: {
              f1_title: "انتهاڪاري خفيو (پوشيدو)",
              f1_desc: "توهان جي معلومات هميشه محفوظ رهندي آهي",
              f2_title: "فوري جواب",
              f2_desc: "اسان عام طور تي 24 ڪلاڪن جي اندر جواب ڏيندا آهيون",
              f3_title: "پروفيشنل مهارت",
              f3_desc: "مصالحت جي ماهرن جي تجربيڪار ٽيم"
            }
          },
          "contact_section": {
            "info_col": {
              "title": "رابطو ڪريو",
              "lead": "اسان توهان جي سوالن جا جواب ڏيڻ ۽ توهان جي مصالحتي سفر لاءِ گهربل مدد فراهم ڪرڻ لاءِ حاضر آهيون.",
              "labels": {
                "address": "دفتر جو پتو",
                "email": "اي ميل",
                "phone": "فون نمبر",
                "whatsapp": "واٽس ائپ",
                "hours": "دفتر جا اوقات"
              },
              "values": {
                "address_text": "253، پي.اي.سي.ايڇ.ايس، بلاڪ-6، شاهراهه فيصل، ڪراچي 75400، پاڪستان",
                "hours_text": "سومر کان جمعو صبح 9:00 کان شام 5:00 تائين (پاڪستاني وقت)"
              }
            },
            "form_col": {
              "title": "اسان کي پيغام موڪليو",
              "lead": "ڪجهه تفصيل شيئر ڪريو ۽ اسان جي ٽيم جلد ئي توهان سان رابطو ڪندي.",
              "labels": {
                "name": "پورو نالو",
                "email": "اي ميل ائڊريس",
                "phone": "فون نمبر",
                "inquiry": "پوڇا ڳاڇا جو قسم",
                "subject": "موضوع",
                "message": "پيغام",
                "consent": "سڀئي ڳالهيون انتهائي خفيه آهن ۽ توهان جي معلومات مڪمل محفوظ آهي."
              },
              "placeholders": {
                "name": "توهان جو نالو",
                "email": "توهان جي اي ميل",
                "phone": "توهان جو فون",
                "subject": "توهان جي پيغام جو موضوع",
                "message": "اسان توهان جي ڪهڙي مدد ڪري سگهون ٿا؟"
              },
              "options": {
                "default": "هڪ آپشن چونڊيو",
                "general": "عمومي پڇا ڳاڇا",
                "mediation": "مصالحتي خدمتون",
                "training": "تربيت ۽ سرٽيفڪيشن",
                "membership": "ميمبرشپ جي معلومات",
                "advisory": "ادارتي ADR ايڊوائزري",
                "workshops": "ورڪشاپون ۽ آگاهي سيزنز",
                "event": "ايونٽ ۾ شرڪت",
                "partnership": "شراڪتداري ۽ تعاون",
                "media": "ميڊيا ۽ پريس انڪوائري",
                "consultation": "قانوني / پاليسي مشاورت",
                "feedback": "شڪايت يا راءِ",
                "volunteer": "رضاڪاراڻا موقعا",
                "speaker": "اسپيڪر / ٽرينر جي درخواست",
                "corporate": "ڪارپوريٽ مصالحتي تعاون",
                "community": "ڪميونٽي مصالحتي تعاون",
                "support": "تڪنيڪي ويب سائيٽ سپورٽ"
              },
              "btn_text": "پيغام موڪليو",
              "success_msg": "توهان جو پيغام ڪاميابيءَ سان موڪليو ويو آهي. اسان 24 ڪلاڪن اندر توهان سان رابطو ڪنداسين.",
              "error_msg": "معذرت، پيغام موڪلڻ ۾ ڪا غلطي ٿي آهي. مهرباني ڪري ٻيهر ڪوشش ڪريو.",
              "note": "نه ڪو قانوني عمل، نه عدالت. صرف تصفيو. اسان عام طور تي 24 ڪلاڪن اندر جواب ڏيندا آهيون."
            }
          },
          "map_section": {
            "title": "اسان جي دفتر تشريف آڻيو",
            "lead": "اسان توهان کي ڪراچي ۾ واقع اسان جي دفتر ۾ آمد تي خوش آمديد چئون ٿا.",
            "iframe_title": "پي ايم اي آفيس لوڪيشن — 253، پي.اي.سي.ايڇ.ايس، بلاڪ-6، ڪراچي"
          }
        },
        "faq_page": {
          "hero": {
            "img_alt": "عام سوالن جي صفحي جو هيرو ايميج",
            "title": "عام طور پڇيا ويندڙ سوال",
            "lead": "مصالحت ۽ اسان جي خدمتن بابت عام طور تي پڇيا ويندڙ سوالن جا جواب هتي ڳولهيو."
          },
          "faq_section": {
            "items": {
              "q1": {
                "question": "مصالحت (MEDIATION) جي معياري شق ڇا آهي؟",
                "answer": "هن معاهدي جي ڌرين جي وچ ۾ پيدا ٿيندڙ ڪنهن به ۽ هر قسم جي تڪرار، اختلاف يا سوال کي پهريان ڌريون باهمي ڳالهين ذريعي دوستانه نموني حل ڪرڻ جي ڪوشش ڪنديون. جيڪڏهن تڪرار، اختلاف يا سوال هڪ ڌر پاران دوستانه تصفئي لاءِ ٻي ڌر جي درخواست جي وصولي کانپوءِ تيهه (30) ڏينهن اندر خط و ڪتابت يا باهمي بحث ذريعي خوش اسلوبي يا تسلي بخش طريقي سان حل نٿا ٿي سگهن، ته ان کي PMA جي مڃيل مصالحتي پينل ڏانهن موڪليو ويندو. مصالحت جي ڪارروائي بين الاقوامي سطح تي تسليم ٿيل اصولن تحت هلائي ويندي."
              },
              "q2": {
                "question": "وقت ۽ لاڳت جو هڪ متبادل – مصالحت",
                "answer": "مصالحت وڏين قانوني ڪارروائين جو هڪ تيز رفتار، سستو ۽ خفيه متبادل پيش ڪري ٿي. هي پيشيوراڻا ۽ ذاتي لاڳاپا برقرار رکندي ڌرين کي دوستانه نموني تڪرار حل ڪرڻ ۾ مدد ڏئي ٿي."
              },
              "q3": {
                "question": "مصالحت (MEDIATION) ڇا آهي؟",
                "answer": "مصالحت هڪ رضاڪاراڻو ۽ خفيه عمل آهي جنهن ۾ هڪ غير جانبدار ٽيون ڌر تڪرار جي شڪار ڌرين کي باهمي طور تي قابل قبول معاهدي تائين پهچڻ ۾ مدد فراهم ڪندي آهي."
              },
              "q4": {
                "question": "مصالحت لاءِ ڪيئن رجوع ڪجي؟",
                "answer": "توهان مصالحتي خدمتون شروع ڪرڻ لاءِ اسان جي ويب سائيٽ يا دفتر ذريعي پي ايم اي (PMA) سان رابطو ڪري سگهو ٿا. اسان جي ٽيم هن سڄي عمل ۾ توهان جي رهنمائي ڪندي ۽ توهان کي مستند مصالحتي ماهرن سان ملائيندي."
              },
              "q5": {
                "question": "مصالحت جا فائدا",
                "benefits_list": {
                  "b1": "تڪرارن جو تيز رفتار حل",
                  "b2": "گھٽ قانوني اخراجات",
                  "b3": "خفيه تصفئي جي ڪارروائي",
                  "b4": "لچڪدار حل",
                  "b5": "ڌرين جي وچ ۾ بهتر رابطو ۽ ڳالهه ٻولهه"
                }
              },
              "q6": {
                "question": "مصالحت جو سيشن ڪڏهن منعقد ٿيندو؟",
                "answer": "مصالحت جي سيشن جو شيڊول ٻنهي ڌرين ۽ ثالث (مصالحت ڪار) جي دستيابي جي بنياد تي طئي ڪيو ويندو آهي. PMA سهولت ۽ ڪارڪردگي کي يقيني بڻائڻ لاءِ ان عمل کي مربوط ڪندي آهي."
              },
              "q7": {
                "question": "مصالحت دوران ڇا ٿيندو آهي؟",
                "answer": "مصالحت دوران، ٻئي ڌريون هڪ ثالث جي موجودگي ۾ هڪ منظم ماحول ۾ پنهنجي تحفظات تي ڳالهائينديون آهن، جيڪو حل ۽ گڏيل نڪتا ڳولڻ ۾ مدد ڪندو آهي."
              },
              "q8": {
                "question": "جيڪڏهن ڪو معاهدو طئي نه ٿئي ته ڇا ٿيندو؟",
                "answer": "جيڪڏهن مصالحت جي نتيجي ۾ ڪو معاهدو طئي نٿو ٿئي، ته ٻئي ڌريون پنهنجي وٽ موجود ٻيا قانوني متبادل يا تڪرار جي حل جا اختيار حاصل ڪرڻ لاءِ آزاد رهنديون آهن."
              },
              "q9": {
                "question": "مصالحت جي سيشن ۾ ڪير شرڪت ڪري سگهي ٿو؟",
                "answer": "مصالحت جي سيشن ۾ صرف لاڳاپيل ڌريون، سندن مجاز نمائندا، قانوني صلاحڪار (جيڪڏهن اجازت هجي) ۽ ثالث ئي شرڪت ڪري سگهن ٿا."
              },
              "q10": {
                "question": "ان تي ڪيتري لاڳت ايندي؟",
                "answer": "مصالحت جي اخراجات جو دارومدار تڪرار جي نوعيت، پيچيدگي ۽ مدت تي هوندو آهي. PMA مصالحتي عمل شروع ٿيڻ کان اڳ فيس جي مڪمل تفصيل فراهم ڪندي آهي."
              }
            },
            "contact_box": {
              "title": "اڃا به ڪو سوال آهي؟",
              "lead": "اسان توهان جي مدد لاءِ حاضر آهيون. اسان سان رابطو ڪريو ۽ اسان جي ٽيم کي توهان جي رهنمائي ڪندي خوشي ٿيندي.",
              "btn_text": "اسان سان رابطو ڪريو"
            }
          }

        },
        "training-page": {
          "hero": {
            "hero_img_alt": "تربيت واري صفحي جو هيرو ايميج",
            "eyebrow": "پيشيوراڻي تربيت",
            "title_part1": "بين الاقوامي طور تي تسليم ٿيل تربيت ذريعي",
            "title_part2": "پاڪستان جي مستقبل جي مصالحت ڪارن جي تياري",
            "lead": "پنهنجي صلاحيتن کي مضبوط ڪريو. پنهنجي طريقيڪار کي بهتر بڻايو. سماج ۾ ڳالهه ٻولهه، فهم و ادراڪ ۽ پرامن حل کي هٿي ڏيو.",
            "banner": {
              "logo_alt": "انٽرنيشنل ميڊيئيشن انسٽيٽيوٽ",
              "title": "آءِ ايم آءِ (IMI) پاران تصديق ٿيل ميڊيئيٽر ٽريننگ پروگرام",
              "tagline": "بين الاقوامي طور تي مڃيل. عالمي سطح تي معتبر.",
              "desc": "PMA انٽرنيشنل ميڊيئيشن انسٽيٽيوٽ (IMI) سان هڪ باقاعده رجسٽرڊ ٽريننگ فراهم ڪندڙ آهي. اسان جو IMI مان تصديق ٿيل ميڊيئيٽر ٽريننگ پروگرام پيشيوراڻي مصالحتي تربيت جي اعليٰ ترين عالمي معيارن تي پورو لهي ٿو.",
              "link_text": "وڌيڪ معلومات لاءِ مهرباني ڪري لنڪ تي ڪلڪ ڪريو"
            }
          },
          "training_programs_section": {
            "header": {
              "title_part1": "اسان جا",
              "title_part2": "تربيت جا",
              "title_part3": "پروگرامز"
            },
            "programs": {
              "accredited_course": {
                "badge": "ايڪريڊيٽڊ (مسلمه) ڪورس",
                "title": "مصالحتي مهارتن جو ايڪريڊيٽڊ ڪورس",
                "desc_p1": "هي ڪورس انهن ماڻهن لاءِ آهي جيڪي مصالحتي مهارتن کي ڄاڻڻ ۾ دلچسپي رکن ٿا. هڪ اميدوار هن عمل کان مڪمل واقفيت حاصل ڪري وٺندو.",
                "desc_p2": "سڀئي ڪورسز عملي مشقن ۽ رول پلي (ڪردار نگاري) ذريعي ڪرايا ويندا آهن.",
                "metrics": {
                  "total_hours": "ڪل ڪلاڪ",
                  "days": "ڏينهن (اڱارو کان ڇنڇر)",
                  "daily_hours": "روزاني جا ڪلاڪ",
                  "cert_status": "سرٽيفڪيٽ",
                  "cert_sub": "تصديق ٿيل (Accredited)"
                },
                "outcomes": {
                  "headline": "ڪورس جي پڄاڻي تي شرڪت ڪندڙ ان قابل ٿي ويندا ته:",
                  "list": {
                    "item1": "مصالحت ۾ مهارت حاصل ڪري سگهن",
                    "item2": "مصالحت جا بهترين طريقا سيکي سگهن",
                    "item3": "مصالحت بابت پاڪستان جا قانون ڄاڻي سگهن",
                    "item4": "مذاڪرات جون مهارتون سيکي سگهن",
                    "item5": "سند يافته مصالحت ڪار بڻجي سگهن"
                  }
                },
                "btn_text": "ڪورس جي تفصيل ڏسو"
              },
              "introductory_course": {
                "badge": "نان-ايڪريڊيٽڊ ڪورس",
                "title": "مصالحتي مهارتن جو تعارفي ڪورس",
                "desc_p1": "هي ڪورس انهن ماڻهن لاءِ آهي جيڪي مصالحتي مهارتن جي بنيادي سمجھاڻي حاصل ڪرڻ ۾ دلچسپي رکن ٿا. هي بلڪل شروعاتي سطح جو ڪورس آهي.",
                "desc_p2": "هن ۾ ڪابه عملي مشق يا رول پلي شامل ناهي.",
                "metrics": {
                  "total_hours": "ڪل ڪلاڪ",
                  "days": "ڏينهن (جلد اعلان ڪيو ويندو)",
                  "daily_hours": "روزاني جا ڪلاڪ",
                  "cert_status": "غير تصديق ٿيل"
                },
                "btn_text": "ڪورس جي تفصيل ڏسو"
              },
              "basic_info_course": {
                "badge": "نان-ايڪريڊيٽڊ ڪورس",
                "title": "مصالحتي مهارتن بابت بنيادي معلومات",
                "desc_p1": "هي ڪورس انهن ماڻهن لاءِ آهي جيڪي مصالحتي مهارتن جي بنيادي سمجھاڻي حاصل ڪرڻ ۾ دلچسپي رکن ٿا. هي بلڪل شروعاتي سطح جو ڪورس آهي.",
                "desc_p2": "هن ۾ ڪابه عملي مشق يا رول پلي شامل ناهي.",
                "metrics": {
                  "total_hours": "ڪل ڪلاڪ",
                  "days": "ڏينهن (1 ڏينهن)",
                  "daily_hours": "روزاني جا ڪلاڪ",
                  "cert_status": "غير تصديق ٿيل"
                },
                "btn_text": "ڪورس جي تفصيل ڏسو"
              }
            }
          },
          "attendees_section": {
            "header": {
              "title_part1": "ڪنهن کي",
              "title_part2": "شرڪت",
              "title_part3": "ڪرڻ گهرجي؟",
              "subtitle": "هيءَ تربيت انهن پيشيور ماڻهن لاءِ تيار ڪئي وئي آهي جيڪي مثبت تبديلي آڻڻ چاهين ٿا"
            },
            "cards": {
              "c1": {
                "title": "وڪيل ۽ قانوني پيشيور ماڻهو",
                "desc": "پنهنجي تڪرارن جي حل جي مهارتن کي بهتر بڻايو ۽ پنهنجي پيشيوراڻي دائري کي وسيع ڪريو."
              },
              "c2": {
                "title": "جج ۽ عدالتي عملدار",
                "desc": "اي ڊي آر (ADR) جي پنهنجي سمجھاڻي کي مضبوط ڪريو ۽ مقدمي جي مؤثر انتظام ۾ مدد ڪريو."
              },
              "c3": {
                "title": "ڪارپوريٽ پيشيور ماڻهو",
                "desc": "ڪم جي جڳهه تي مذاڪرات، رابطي ۽ تڪرارن جي انتظام کي بهتر بڻايو."
              },
              "c4": {
                "title": "ايڇ آر ۽ ائڊمن جا پيشيور ماڻهو",
                "desc": "انسانن تي ٻڌل تڪرارن جو حل ۽ ڪم جي جڳهه تي هم آهنگي پيدا ڪريو."
              },
              "c5": {
                "title": "اين جي اوز ۽ ڪميونٽي اڳواڻ",
                "desc": "برادري جي تڪرارن کي حل ڪريو ۽ سماجي يڪجهتي ۽ شموليت کي هٿي ڏيو."
              },
              "c6": {
                "title": "شاگرد ۽ اي ڊي آر جا شوقين",
                "desc": "مصالحت ۾ پنهنجي سفر جي شروعات ڪريو ۽ اي ڊي آر (ADR) ۾ هڪ مضبوط بنياد وجهو."
              },
              "c7": {
                "title": "سرڪاري عملدار",
                "desc": "عوامي شعبي جي تڪرارن ۽ پاليسي جي نفاذ تي مصالحت جون مهارتون لاڳو ڪريو."
              },
              "c8": {
                "title": "اي ڊي آر ۽ مصالحت ۾ دلچسپي رکندڙ ڪو به فرد",
                "desc": "انهن سڀني ماڻهن لاءِ کليل آهي جيڪي پرامن ڳالهه ٻولهه ۽ تڪرارن جي حل جو جذبو رکن ٿا."
              }
            }
          },
          "cta_resolution_section": {
            "graphic_alt": "مختلف پس منظر، هڪڙو مقصد",
            "title": "مختلف پس منظر. هڪڙو مقصد: پرامن حل.",
            "desc": "اسان جي تربيت مختلف شعبن سان تعلق رکندڙ اهڙن پيشيور ماڻهن کي گڏ ڪري ٿي جيڪي ڳالهه ٻولهه، مفاهمت ۽ بهتر سماج جي اڏاوت تي يقين رکن ٿا.",
            "btn_text": "ڪورس لاءِ رجسٽريشن ڪريو"
          },
          "registration_section": {
            "left_panel": {
              "badge_text": "اسان جي پروگرام ۾ شامل ٿيو",
              "title": "اسان جي مصالحتي تربيتي پروگرامن جو حصو بڻجو",
              "tagline": "اعليٰ ڪارڪردگي ڏانهن پهريون قدم وڌايو",
              "desc": "اڄ ئي رجسٽريشن ڪرايو ۽ بين الاقوامي سطح تي تسليم ٿيل تربيتي پروگرامن جو حصو بڻجو جيڪي توهان جي مهارتن کي نکارڻ، توهان جي پيشي کي مضبوط ڪرڻ ۽ سماج ۾ پرامن حل کي هٿي ڏيڻ لاءِ تيار ڪيا ويا آهن.",
              "img_alt": "زن ميڊيٽيشن پٿر",
              "seat_badge": {
                "title": "پنهنجي سيٽ محفوظ ڪريو",
                "desc_part1": "محدود سيٽون",
                "desc_part2": "هر بيچ ۾ دستياب آهن."
              }
            },
            "form_panel": {
              "header_title": "رجسٽريشن جا تفصيل",
              "labels": {
                "name": "پورو نالو",
                "email": "اي ميل ائڊريس",
                "phone": "فون نمبر",
                "background": "پيشيوراڻو پس منظر",
                "city": "شهر",
                "program": "تربيت جو پروگرام چونڊيو",
                "additional_info": "اضافي معلومات (اختياري)"
              },
              "placeholders": {
                "name": "پنهنجو پورو نالو داخل ڪريو",
                "email": "پنهنجي اي ميل ائڊريس داخل ڪريو",
                "phone": "پنهنجو فون نمبر داخل ڪريو",
                "background": "مثال طور: وڪيل، ايڇ آر پيشيور، شاگرد",
                "city": "پنهنجو شهر داخل ڪريو",
                "program_default": "-- مهرباني ڪري هڪ پروگرام چونڊيو --",
                "additional_info": "ڪا به اضافي معلومات جيڪا توهان شيئر ڪرڻ چاهيو"
              },
              "options": {
                "accredited": "مصالحتي مهارتن جو ايڪريڊيٽڊ ڪورس",
                "introductory": "مصالحتي مهارتن جو تعارفي ڪورس",
                "basic": "مصالحتي مهارتن بابت بنيادي معلومات"
              },
              "btn_text": "دخلي لاءِ درخواست ڏيو",
              "privacy_note": "توهان جي معلومات محفوظ آهي ۽ صرف رجسٽريشن جي مقصدن لاءِ استعمال ڪئي ويندي.",
              "messages": {
                "success": "رجسٽريشن جمع ٿي وئي! اسان 24 ڪلاڪن اندر توهان سان رابطو ڪنداسين.",
                "error": "معذرت، توهان جي رجسٽريشن جمع ڪرڻ ۾ هڪ غلطي پيش آئي آهي. مهرباني ڪري ٻيهر ڪوشش ڪريو."
              }
            }
          },
          "training_badges_section": {
            "badges": {
              "b1": {
                "title": "آءِ ايم آءِ (IMI) پاران مڃيل",
                "desc": "اسان جا پروگرام انٽرنيشنل ميڊيئيشن انسٽيٽيوٽ (IMI) پاران تصديق ٿيل آهن."
              },
              "b2": {
                "title": "ماهر ٽرينرز",
                "desc": "تجربيڪار مصالحت ڪارن ۽ صنعتي ماهرن کان سکو."
              },
              "b3": {
                "title": "بين الاقوامي معيار",
                "desc": "عالمي سطح تي تسليم ٿيل مصالحتي معيارن مطابق تربيت."
              },
              "b4": {
                "title": "پيشيوراڻي سرٽيفڪيشن",
                "desc": "ڪورس ڪاميابيءَ سان مڪمل ڪرڻ تي هڪ معتبر سرٽيفڪيٽ حاصل ڪريو."
              }
            }
          },
          "popup_msac": {
            "sidebar": {
              "badge": "ايڪريڊيٽڊ ڪورس",
              "title_part1": "مصالحتي مهارتن جو",
              "title_part2": "ايڪريڊيٽڊ ڪورس",
              "desc": "هي ڪورس انهن ماڻهن لاءِ آهي جيڪي مصالحتي مهارتن کي ڄاڻڻ ۾ دلچسپي رکن ٿا. هڪ اميدوار هن عمل کان مڪمل واقفيت حاصل ڪري وٺندو. سڀئي ڪورسز عملي مشقن ۽ رول پلي (ڪردار نگاري) ذريعي ڪرايا ويندا آهن.",
              "stats": {
                "type": { "label": "ڪورس جو قسم", "value": "سرٽيفڪيٽ تسليم ٿيل" },
                "total_hours": { "label": "ڪل ڪلاڪ", "value": "40" },
                "duration": { "label": "دورانيو", "value": "5 ڏينهن (هڪ هفتو)" },
                "daily_hours": { "label": "روزاني جا ڪلاڪ", "value": "8" },
                "days": { "label": "تربيت جا ڏينهن", "value": "اڱارو کان ڇنڇر" },
                "time": { "label": "تربيت جو وقت", "value": "صبح 9 بجن کان شام 5 بجن تائين" }
              }
            },
            "main_content": {
              "about": {
                "title": "ڪورس بابت معلومات",
                "desc": "هي جامع پروگرام شرڪت ڪندڙن کي مصالحت جي عملي مهارتن، مذاڪرات جي طريقن ۽ مصالحت بابت پاڪستاني قانونن جي سمجھاڻي سان آراسته ڪري ٿو. عملي سکيا، مشقن ۽ رول پلي جي ذريعي شرڪت ڪندڙن کي حقيقي زندگي جي تڪرارن کي مؤثر ۽ اخلاقي طور تي حل ڪرڻ لاءِ تيار ڪيو ويندو."
              },
              "outcomes": {
                "title": "توهان ڇا سيکندا",
                "items": [
                  "مصالحت ۾ مهارت حاصل ڪرڻ",
                  "مصالحت جا بهترين طريقا سيکڻ",
                  "مصالحت بابت پاڪستان جا قانون ڄاڻڻ",
                  "مذاڪرات جون مهارتون سيکڻ",
                  "سند يافته مصالحت ڪار بڻجڻ",
                  "مؤثر حل جا معاهدا تيار ڪرڻ"
                ]
              },
              "columns": {
                "outline": {
                  "title": "ڪورس جو خاڪو",
                  "items": [
                    "متبادل تڪرارن جي حل (ADR) جو پس منظر",
                    "مصالحت جا مرحلا ۽ فيزز",
                    "غير زباني ۽ زباني رابطو (Communication)",
                    "مذاڪرات جو انداز (Negotiation Style)",
                    "سوال ڪرڻ جا طريقا ۽ ٽيڪنيڪون",
                    "ممڪنه معاهدي جو دائرو (Zone of Potential Agreement)",
                    "ڊيڊ لاڪ (پند) کي ختم ڪرڻ",
                    "حل جي معاهدي جو مسودو ٺاهڻ",
                    "مصالحت لاءِ موزون مقدمو",
                    "ذاتي تشخيص (Self-assessment)",
                    "سودي بازي جون ٽيڪنيڪون"
                  ]
                },
                "structure": {
                  "title": "ڪورس جي ساخت",
                  "modules": [
                    { "badge": "ماڊيول 01", "title": "متبادل تڪرارن جي حل (ADR) جو خاڪو" },
                    { "badge": "ماڊيول 02", "title": "مصالحتي عمل ۽ ان جا مرحلا" },
                    { "badge": "ماڊيول 03", "title": "رابطا ۽ سوال ڪرڻ جا طريقا" },
                    { "badge": "ماڊيول 04", "title": "مذاڪرات جون ٽيڪنيڪون" },
                    { "badge": "ماڊيول 05", "title": "ڊيڊ لاڪ جو حل" },
                    { "badge": "ماڊيول 06", "title": "معاهدي جو مسودو ۽ پڄاڻي" },
                    { "badge": "ماڊيول 07", "title": "ذاتي تشخيص ۽ بهترين طريقا" }
                  ]
                },
                "methodology": {
                  "title": "تربيت جو طريقو",
                  "items": [
                    "تجرباتي ۽ عملي سکيا",
                    "عملي مشقون",
                    "رول پلي ۽ سميوليشنز",
                    "گروپ ۾ بحث (مباحثا)",
                    "ڪيس اسٽڊيز (حقيقي مثالون)",
                    "انٽرئيڪٽو سيشنز"
                  ]
                }
              },
              "certification": {
                "title": "سرٽيفڪيشن جو نتيجو",
                "desc": "ڪامياب شرڪت تي شرڪت ڪندڙن کي ڪورس مڪمل ڪرڻ جو سرٽيفڪيٽ ڏنو ويندو. هي ڪورس ماڻهن کي مختلف ماحولن ۾ اخلاقي، پيشيوراڻي ۽ مؤثر طريقي سان مصالحتي مهارتون لاڳو ڪرڻ لاءِ تيار ڪري ٿو."
              },
              "attendees": {
                "title": "ڪنهن کي شرڪت ڪرڻ گهرجي؟",
                "items": [
                  "وڪيل ۽ قانوني پيشيور ماڻهو",
                  "جج ۽ عدالتي عملدار",
                  "ڪارپوريٽ پيشيور ماڻهو",
                  "ايڇ آر ۽ ائڊمن جا پيشيور ماڻهو",
                  "اين جي اوز ۽ ڪميونٽي اڳواڻ",
                  "شاگرد ۽ اي ڊي آر جا شوقين"
                ]
              },
              "btn_text": "هن پروگرام لاءِ درخواست ڏيو"
            }
          },
          "popup_msic": {
            "sidebar": {
              "badge": "نان-ايڪريڊيٽڊ ڪورس",
              "title_part1": "مصالحتي مهارتن جو",
              "title_part2": "تعارفي ڪورس",
              "desc": "هي ڪورس انهن ماڻهن لاءِ آهي جيڪي مصالحتي مهارتن جي بنيادي سمجھاڻي حاصل ڪرڻ ۾ دلچسپي رکن ٿا. هي بلڪل شروعاتي سطح جو ڪورس آهي ۽ غير مسلمه آهي.",
              "stats": {
                "type": { "label": "نان-ايڪريڊيٽڊ ڪورس", "value": "" },
                "total_hours": { "label": "ڪل ڪلاڪ", "value": "16" },
                "duration": { "label": "دورانيو", "value": "2 ڪاروباري ڏينهن" },
                "daily_hours": { "label": "روزاني جا ڪلاڪ", "value": "8" },
                "days": { "label": "تربيت جا ڏينهن", "value": "ڪي به ٻه ڏينهن (جلد اعلان ڪيو ويندو)" },
                "time": { "label": "تربيت جو وقت", "value": "صبح 9 بجن کان شام 5 بجن تائين" }
              }
            },
            "main_content": {
              "about": {
                "title": "ڪورس بابت معلومات",
                "desc": "هي تعارفي ڪورس مصالحتي مهارتن ۽ مصالحت جي عمل جي بنيادي سمجھاڻي فراهم ڪري ٿو. شرڪت ڪندڙ مصالحت جي عمل کان واقف ٿي ويندا ۽ سمجهي سگهندا ته مستقبل ۾ ان جي ڪهڙي اهميت آهي. هي ڪورس نظرياتي (Theory-oriented) آهي جنهن ۾ ڪابه عملي مشق يا رول پلي شامل ناهي."
              },
              "outcomes": {
                "title": "توهان ڇا سيکندا",
                "items": [
                  "مصالحت جي بنيادي ڳالهين کي سمجهڻ",
                  "مصالحت جي اهم تصورن کي ڄاڻڻ",
                  "اهو سمجهڻ ته مصالحت ڪڏهن استعمال ڪري سگهجي ٿي",
                  "مصالحتي عمل بابت آگاهي حاصل ڪرڻ",
                  "هڪ واقف ڪار ۽ باخبر صارف بڻجڻ"
                ]
              },
              "columns": {
                "outline": {
                  "title": "ڪورس جو خاڪو",
                  "items": [
                    "متبادل تڪرارن جي حل (ADR) جو پس منظر",
                    "مصالحت جا مرحلا ۽ فيزز",
                    "غير زباني ۽ زباني رابطو (Communication)",
                    "مذاڪرات جو انداز (Negotiation Style)",
                    "سوال ڪرڻ جا طريقا ۽ ٽيڪنيڪون",
                    "ممڪنه معاهدي جو دائرو (Zone of Potential Agreement)",
                    "ڊيڊ لاڪ (پند) کي ختم ڪرڻ",
                    "حل جي معاهدي جو مسودو ٺاهڻ",
                    "مصالحت لاءِ موزون مقدمو",
                    "سودي بازي جون ٽيڪنيڪون"
                  ]
                },
                "info_table": {
                  "title": "ڪورس جي معلومات",
                  "trainer": { "label": "ٽرينر", "value": "جلد اعلان ڪيو ويندو (TBA)" },
                  "daily_hours": { "label": "روزاني جا ڪلاڪ", "value": "اٺ (8)" },
                  "total_hours": { "label": "ڪل ڪلاڪ", "value": "سورنهن (16)" },
                  "days": { "label": "تربيت جا ڏينهن", "value": "ڪي به ٻه ڏينهن (جلد اعلان ڪيو ويندو)" },
                  "time": { "label": "تربيت جو وقت", "value": "صبح 9 بجن کان شام 5 بجن تائين" },
                  "duration": { "label": "ڪورس جو دورانيو", "value": "ٻه (2) ڪاروباري ڏينهن" },
                  "type": { "label": "ڪورس جو قسم", "value": "نان-ايڪريڊيٽڊ ڪورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "ڪنهن کي شرڪت ڪرڻ گهرجي؟",
                  "items": [
                    "شاگرد ۽ نوان گريجوئيٽس",
                    "ڪنهن به شعبي سان تعلق رکندڙ پيشيور ماڻهو",
                    "ايڇ آر ۽ ائڊمن جا پيشيور ماڻهو",
                    "اين جي اوز ۽ ڪميونٽي ورڪرز",
                    "مصالحت ۾ دلچسپي رکندڙ ڪو به فرد"
                  ]
                },
                "note": {
                  "title": "اهم ڳالهه",
                  "desc": "هي هڪ بنيادي سطح جو ڪورس آهي جيڪو صرف معلومات ۽ آگاهي فراهم ڪرڻ لاءِ تيار ڪيو ويو آهي. هن ڪورس ۾ ڪابه عملي مشق، رول پلي يا ذاتي تشخيص شامل ناهي."
                }
              },
              "btn_text": "هن ڪورس لاءِ رجسٽريشن ڪريو"
            }
          },
          "popup_bims": {
            "sidebar": {
              "badge": "نان-ايڪريڊيٽڊ ڪورس",
              "title_part1": "مصالحتي مهارتن بابت",
              "title_part2": "بنيادي معلوماتي ڪورس",
              "desc": "هي تعارفي ڪورس مصالحتي مهارتن ۽ انهن جي استعمال بابت عام آگاهي فراهم ڪرڻ لاءِ تيار ڪيو ويو آهي. هي بنيادي سطح جو ڪورس آهي ۽ غير مسلمه آهي.",
              "stats": {
                "type": { "label": "نان-ايڪريڊيٽڊ ڪورس", "value": "" },
                "total_hours": { "label": "ڪل ڪلاڪ", "value": "8" },
                "duration": { "label": "دورانيو", "value": "1 ڏينهن" },
                "daily_hours": { "label": "روزاني جا ڪلاڪ", "value": "8" },
                "days": { "label": "تربيت جا ڏينهن", "value": "ڪو به ڏينهن (جلد اعلان ڪيو ويندو)" },
                "time": { "label": "تربيت جو وقت", "value": "صبح 9 بجن کان شام 5 بجن تائين" }
              }
            },
            "main_content": {
              "about": {
                "title": "ڪورس بابت معلومات",
                "desc": "هي بنيادي معلوماتي ڪورس مصالحتي مهارتن، مصالحت جي عمل، ۽ تڪرارن جي حل جي اهم تصورن بابت عام آگاهي ڏيڻ لاءِ تيار ڪيو ويو آهي. شرڪت ڪندڙ بغير ڪنهن رول پلي يا عملي مشقن جي مصالحتي طريقي ڪار جي بنيادي سمجھ حاصل ڪندا."
              },
              "outcomes": {
                "title": "توهان ڇا سيکندا",
                "items": [
                  "مصالحت جي بنيادي ڳالهين کي سمجهڻ",
                  "مصالحت جي اهم تصورن کي ڄاڻڻ",
                  "اهو سمجهڻ ته مصالحت ڪڏهن استعمال ڪري سگهجي ٿي",
                  "مصالحتي عمل بابت آگاهي حاصل ڪرڻ",
                  "تڪرارن جي حل جا بنيادي ۽ بنيادي تصور"
                ]
              },
              "columns": {
                "outline": {
                  "title": "ڪورس جو خاڪو",
                  "items": [
                    "متبادل تڪرارن جي حل (ADR) جو پس منظر",
                    "مصالحت جا مرحلا ۽ فيزز",
                    "مصالحت جو تعارف",
                    "مصالحتي عمل جو جائزو",
                    "مصالحت ۾ رابطو (Communication)",
                    "سوال ۽ وضاحت",
                    "ڊيڊ لاڪ (پند) کي سمجهڻ",
                    "معاهدي جا بنيادي اصول"
                  ]
                },
                "info_table": {
                  "title": "ڪورس جي معلومات",
                  "trainer": { "label": "ٽرينر", "value": "جلد اعلان ڪيو ويندو (TBA)" },
                  "daily_hours": { "label": "روزاني جا ڪلاڪ", "value": "اٺ (8)" },
                  "total_hours": { "label": "ڪل ڪلاڪ", "value": "اٺ (8)" },
                  "days": { "label": "تربيت جا ڏينهن", "value": "ڪو به ڏينهن (جلد اعلان ڪيو ويندو)" },
                  "time": { "label": "تربيت جو وقت", "value": "صبح 9 بجن کان شام 5 بجن تائين" },
                  "duration": { "label": "ڪورس جو دورانيو", "value": "هڪ (1) ڏينهن" },
                  "type": { "label": "ڪورس جو قسم", "value": "نان-ايڪريڊيٽڊ ڪورس" }
                }
              },
              "bottom_panel": {
                "attendees": {
                  "title": "ڪنهن کي شرڪت ڪرڻ گهرجي؟",
                  "items": [
                    "شاگرد ۽ نوان گريجوئيٽس",
                    "ڪنهن به شعبي سان تعلق رکندڙ پيشيور ماڻهو",
                    "ايڇ آر ۽ ائڊمن جا پيشيور ماڻهو",
                    "اين جي اوز ۽ ڪميونٽي ورڪرز",
                    "مصالحت ۾ دلچسپي رکندڙ ڪو به فرد"
                  ]
                },
                "note": {
                  "title": "اهم ڳالهه",
                  "desc": "هي هڪ بنيادي سطح جو ڪورس آهي جيڪو صرف عام معلومات ۽ آگاهي فراهم ڪرڻ لاءِ تيار ڪيو ويو آهي. هن ڪورس ۾ ڪابه عملي مشق، رول پلي يا ذاتي تشخيص شامل ناهي."
                }
              },
              "btn_text": "هن ڪورس لاءِ رجسٽريشن ڪريو"
            }
          }
        },
        "leadership_page": {
          "hero": {
            "eyebrow": "قيادت",
            "title_main": "قيادت",
            "title_accent": "اسان جا ماڻهو، اسان جي طاقت",
            "lead_text": "پاڪستان ۾ ڳالهين، مفاهمت ۽ پرامن حل کي فروغ ڏيڻ لاءِ PMA جي مشن جي اڳواڻي ڪندڙ مخلص ۽ پيشيور ماڻهن سان ملو."
          },
          "directory_filters": {
            "tabs": {
              "executive_team": "ايگزیکٹو ٽيم",
              "sub_committee": "ذيلي ڪميٽي",
              "mediator": "مصالحين (ميڊي ايٽرز)",
              "trainer": "تربيت ڪار (ٽرينرز)",
              "former_president": "سابق صدر"
            },
            "search_placeholder": "نالي يا مهارت ذريعي ڳولھيو..."
          },
          "members": {
            "member_1": {
              "name": "آغا ظفر احمد",
              "title": "صدرسپريم",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "آغا ظفر احمد جو پروفائيل ڏسو"
            },
            "member_2": {
              "name": "صائمه امين خواجه",
              "title": "نائب صدر – اتر (نارٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "صائمه امين خواجه جو پروفائيل ڏسو"
            },
            "member_3": {
              "name": "اسفند يار علي خان",
              "title": "نائب صدر – اتر (نارٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "اسفند يار علي خان جو پروفائيل ڏسو"
            },
            "member_4": {
              "name": "سعيد حبيب",
              "title": "نائب صدر – ڏکڻ (سائوٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم"
              },
              "aria_label": "سعيد حبيب جو پروفائيل ڏسو"
            },
            "member_5": {
              "name": "شبانه علي",
              "title": "نائب صدر – ڏکڻ (سائوٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "pma_accredited": "PMA پاران منظور ٿيل ثالث"
              },
              "aria_label": "شبانه علي جو پروفائيل ڏسو"
            },
            "member_6": {
              "name": "وجيهه عليم",
              "title": "سڪريٽري جنرل",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "وجيهه عليم جو پروفائيل ڏسو"
            },
            "member_7": {
              "name": "سيد صمد الحق",
              "title": "فنانس سڪريٽري",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم"
              },
              "aria_label": "سيد صمد الحق جو پروفائيل ڏسو"
            },
            "member_8": {
              "name": "طارق سعيد رانا",
              "title": "ايگزيڪيوٽو ڪميٽي – اتر (نارٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "طارق سعيد رانا جو پروفائيل ڏسو"
            },
            "member_9": {
              "name": "هما شاهه",
              "title": "ايگزيڪيوٽو ڪميٽي – اتر (نارٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "هما شاهه جو پروفائيل ڏسو"
            },
            "member_10": {
              "name": "اميمه انور خان",
              "title": "ايگزيڪيوٽو ڪميٽي – ڏکڻ (سائوٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم"
              },
              "aria_label": "اميمه انور خان جو پروفائيل ڏسو"
            },
            "member_11": {
              "name": "مستنصر ذاڪر",
              "title": "ايگزيڪيوٽو ڪميٽي – ڏکڻ (سائوٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "مستنصر ذاڪر جو پروفائيل ڏسو"
            },
            "member_12": {
              "name": "عدنان مفتي",
              "title": "ايگزيڪيوٽو ڪميٽي – ڏکڻ (سائوٿ)",
              "badges": {
                "executive_team": "ايگزيڪيوٽو ٽيم",
                "mediator": "ثالث (ميڊيئيٽر)",
                "cedr_accredited": "CEDR پاران منظور ٿيل ثالث"
              },
              "aria_label": "عدنان مفتي جو پروفائيل ڏسو"
            }
          },
          "trainers": {
            "trainer_1": {
              "name": "مستنصر ذاڪر",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "director_training": "ڊائريڪٽر ٽريننگ",
                "ex_president": "سابق صدر"
              },
              "aria_label": "مستنصر ذاڪر جو پروفائيل ڏسو"
            },
            "trainer_2": {
              "name": "انور ڪاشف ممتاز",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "ex_president": "سابق صدر",
                "leadership_trainer": "ليڊرشپ ٽرينر"
              },
              "aria_label": "انور ڪاشف ممتاز جو پروفائيل ڏسو"
            },
            "trainer_3": {
              "name": "ٽارق سعيد رانا",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "ex_president": "سابق صدر",
                "executive_committee_north": "ايگزيڪيوٽو ڪميٽي – اتر"
              },
              "aria_label": "ٽارق سعيد رانا جو پروفائيل ڏسو"
            },
            "trainer_4": {
              "name": "صائمه امين خواجه",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "executive_member": "ايگزيڪيوٽو ميمبر",
                "vice_president_north": "نائب صدر – اتر"
              },
              "aria_label": "صائمه امين خواجه جو پروفائيل ڏسو"
            },
            "trainer_5": {
              "name": "هما شاهه",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "executive_committee_north": "ايگزيڪيوٽو ڪميٽي – اتر",
                "training_committee": "ٽريننگ ڪميٽي"
              },
              "aria_label": "هما شاهه جو پروفائيل ڏسو"
            },
            "trainer_6": {
              "name": "عثمان جي راشد",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "barrister_at_law": "بئريسٽر ايٽ لا",
                "former_secretary_general": "سابق سڪريٽري جنرل – PMA"
              },
              "aria_label": "عثمان جي راشد جو پروفائيل ڏسو"
            },
            "trainer_7": {
              "name": "اسفند يار علي خان",
              "title": "ماستر ٽرينر",
              "badges": {
                "master_trainer": "ماستر ٽرينر",
                "executive_leadership": "ايگزيڪيوٽو ليڊرشپ",
                "vice_president_north": "نائب صدر – اتر"
              },
              "aria_label": "اسفند يار علي خان جو پروفائيل ڏسو"
            }
          },
          "modal": {
    "about_label": "بابت",
    "expertise_title": "مهارت",
    "training_expertise_title": "تربيت جي مهارت",
    "accreditations_title": "تصديقون / اسناد",
    "education_title": "تعليم",
    "affiliations_title": "پيشيورانه لاڳاپا",
    "media_title": "ميڊيا ۽ عوامي شموليت",
    "coming_soon": "جلد اچي رهيو آهي",
    "profile_close_label": "پروفائل بند ڪريو"
  },
  "profile_modal": {
"aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "صدر",
    "highlight": "\"اڳواڻي، وڪالت ۽ ADR جي مهارت ذريعي ثالثي ۽ بين الاقوامي تڪرارن جي حل کي فروغ ڏيڻ.\"",
    "about": "جناب آغا ظفر احمد پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جو صدر ۽ سپريم ڪورٽ آف پاڪستان جو هڪ نالي ماتر وڪيل آهي، جنهن جو قانوني تجربو 21 سالن کان وڌيڪ آهي. هو ايڊمرلٽي ۽ ميري ٽائيم لا، تجارتي تڪرارن، بين الاقوامي واپار جي معاملن ۽ متبادل حلِ تڪرار (ADR) ۾ پنهنجي مهارت جي ڪري سڃاتو وڃي ٿو. پي ايم اي جي باني ميمبر جي حيثيت سان، هو سڄي پاڪستان ۾ ثالثي ۽ پرامن حلِ تڪرار جي طريقن کي اڳتي وڌائڻ ۾ اهم ڪردار ادا ڪري رهيو آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "ماسٽر ٽرينر", "ايگزیکٽو ليڊرشپ"],
    "expertise": ["تجارتي تڪرار", "ميري ٽائيم ۽ ايڊمرلٽي لا", "بين الاقوامي واپاري تڪرار", "ڪارپوريٽ ثالثي", "سول قانوني چارا جوئي", "متبادل حلِ تڪرار (ADR)"],
    "experience": { "years": "21+ سال", "label": "قانون جي پريڪٽس ۽ تڪرارن جو حل" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث (لنڊن)", "ايم آئي سي اي ڊي آر (MICADR) پينل ثالث", "پي ايم اي تسليم ٿيل ثالث", "بين الاقوامي ثالثي قانون ۾ ڊپلوما"],
    "education": ["بين الاقوامي ثالثي قانون ۾ ڊپلوما – ڪالج آف لا، انگلينڊ ۽ ويلز"],
    "affiliations": ["سپريم ڪورٽ بار ايسوسييشن آف پاڪستان", "سنڌ هاءِ ڪورٽ بار ايسوسييشن", "پاڪستان ميڊيئيٽرز ايسوسييشن (باني ميمبر)", "بحريا يونيورسٽي (سابق وزٽنگ فيڪلٽي)"],
    "media": []
  },
  "saima_amin_khawaja": {
    "name": "سائمه امين خواجه",
    "role": "نائب صدر – نارتھ",
    "highlight": "\"تعليم ۽ ادارتي قيادت ذريعي قانوني سڌارن، ثالثي جي فضيلت، ۽ پائيدار حلِ تڪرار کي فروغ ڏيڻ.\"",
    "about": "محترمه سائمه امين خواجه پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي نائب صدر (نارتھ) ۽ هڪ ماهر قانوني پيشيور آهي، جنهن کي ڪارپوريٽ قانوني چارا جوئي، آئيني قانون، ۽ قانوني سڌارن جي مشاورت جو وسيع تجربو آهي. هوءَ هڪ بين الاقوامي سطح تي تربيت يافته ثالث ۽ ماسٽر ٽرينر آهي، جيڪا پاڪستان ۾ ADR، ماحولياتي قانون ۽ پيشيورانه قانوني تعليم کي اڳتي وڌائڻ لاءِ پرعزم آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "ماسٽر ٽرينر", "ٽريننگ ڪميٽي"],
    "expertise": ["ڪارپوريٽ قانوني چارا جوئي", "آئيني قانون", "قانوني سڌارا ۽ مشاورت", "ماحولياتي قانون", "ثالثي ۽ ADR ٽريننگ", "ڪلائميٽ چينج پاليسي"],
    "experience": { "years": "20+ سال", "label": "قانون جي پريڪٽس, ٽريننگ ۽ ڪنسلٽنسي" },
    "accreditations": ["سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "سي اي ڊي آر ماسٽر ٽرينر", "پي ايم اي تسليم ٿيل ثالث", "ماحولياتي قانون جي تربيت – ايم سي مهتا فائونڊيشن، انڊيا"],
    "education": ["ايل ايل ايم (LL.M) – ڪنگز ڪالج لنڊن"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن", "ڪلائميٽ چينج ڪميشن – لاھور ھاءِ ڪورٽ", "سول سروسز اڪيڊمي", "جوڊيشل اڪيڊمي", "لاهور يونيورسٽي آف مينيجمينٽ سائنسز (LUMS)", "يونيورسٽي ڪالج لاهور (UCL)", "دي انسٽيٽيوٽ آف ليگل اسٽڊيز (TILS)"],
    "media": []
  },
  "asfand_yar_ali_khan": {
    "name": "اسفند يار علي خان",
    "role": "نائب صدر – نارتھ",
    "highlight": "\"قيادت، تربيت ۽ ادارتي مهارت ذريعي ثالثي، ثالثي (آربٽريشن) ۽ قانوني سڌارن کي اڳتي وڌائڻ.\"",
    "about": "بيرسٽر اسفند يار علي خان پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جو نائب صدر (نارتھ) ۽ ان تنظيم جو باني ميمبر آهي. لنڪنز ان جي معزز سوسائٽي پاران بار ۾ گهرايو ويو، هو قانون ۽ ترقيءَ جو هڪ ماهر پيشيور آهي، جنهن کي ثالثي، آربٽريشن، ماحولياتي قانون ۽ ريگيوليٽري معاملن ۾ وسيع مهارت حاصل آهي. هو پاڪستان ۾ اي ڊي آر جي طريقن ۽ قانوني سڌارن کي مضبوط ڪرڻ ۾ سرگرميءَ سان حصو وٺندو آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "ماسٽر ٽرينر", "ضابطه اخلاق ڪميٽي"],
    "expertise": ["آربٽريشن ۽ ADR", "ليبر ۽ ايمپلائمينٽ لا", "ماحولياتي قانون", "خانداني ۽ زمين جا تڪرار", "ريگيوليٽري معاملا", "ثالثي جي تربيت"],
    "experience": { "years": "20+ سال", "label": "قانون جي پريڪٽس، ADR ۽ ٽريبيونل قيادت" },
    "accreditations": ["سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "سي اي ڊي آر ماسٽر ٽرينر", "ميمبر – چارٽرڊ انسٽيٽيوٽ آف آربٽريٽرز (MCIArb)، لنڊن", "پي ايم اي تسليم ٿيل ثالث"],
    "education": ["پوسٽ گريجوئيٽ ڊپلوما ان پروفيشنل ليگل اسڪلز – يوڪي", "ايل ايل بي (Hons) – يوڪي", "ایم فل – پاڪستان", "ایم اي – پاڪستان", "بي اي – پاڪستان"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (باني ميمبر)", "چارٽرڊ انسٽيٽيوٽ آف آربٽريٽرز، لنڊن", "خيبر پختونخوا انوائرنمينٽل پروٽيڪشن ٽريبيونل", "لنڪنز ان، لنڊن"],
    "media": []
  },
  "wajiha_aleem": {
    "name": "وجيهه عليم",
    "role": "سڪريٽري جنرل",
    "highlight": "\"پاڪستان ۾ هڪ مضبوط ADR فريم ورڪ لاءِ قيادت، جدت، ۽ بين الاقوامي تعاون ذريعي ثالثي کي اڳتي وڌائڻ.\"",
    "about": "محترمه وجيهه عليم پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي سڪريٽري جنرل طور خدمتون سرانجام ڏئي رهي آهي، ۽ پاڪستان ۾ ثالثي کي مضبوط ڪرڻ ۽ متبادل حلِ تڪرار (ADR) کي ادارتي شڪل ڏيڻ تي ڌيان ڏيندڙ حڪمت عملين جي قيادت ڪري رهي آهي. 17 سالن کان وڌيڪ ڪارپوريٽ ۽ قانوني تجربي سان، هوءَ جدت، پاليسي سڌارن، عدالتي تعاون ۽ بين الاقوامي ڀائيواريءَ ذريعي ثالثي کي هڪ معتبر ۽ عالمي سطح تي هم آهنگ طريقو بڻائڻ لاءِ ڪوششان آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر (CEDR) تسليم ٿيل ثالث", "ماسٽر ٽرينر", "ايگزیکٽو ليڊرشپ"],
    "expertise": ["متبادل حلِ تڪرار (ADR)", "ڪارپوريٽ ۽ قانوني مشاورت", "ثالثي جي تربيت", "ادارو ورتا ترقي", "پاليسي سڌارا", "بين الاقوامي ADR تعاون"],
    "experience": { "years": "17+ سال", "label": "ڪارپوريٽ، قانوني ۽ ADR ليڊرشپ" },
    "accreditations": ["سي اي ڊي آر يوڪي تصديق ٿيل ثالث", "پي ايم اي تسليم ٿيل ثالث", "بين الاقوامي ADR پريڪٽيشنر"],
    "education": ["ايل ايل ايم (LL.M) – يونائيٽيڊ ڪنگڊم", "بي اي، ايل ايل بي (Hons) – ڪراچي يونيورسٽي"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن", "بين الاقوامي ثالثي ۽ ميڊيئيشن نيٽ ورڪ", "عدالتي ۽ ادارتي ADR قدم"],
    "media": []
  },
  "trainer_aga_zafar_ahmed": {
    "name": "آغا ظفر احمد",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"اڳواڻي، وڪالت ۽ ADR جي مهارت ذريعي ثالثي ۽ بين الاقوامي تڪرارن جي حل کي اڳتي وڌائڻ.\"",
    "about": "آغا ظفر احمد سپريم ڪورٽ آف پاڪستان جو هڪ نمايان وڪيل، تسليم ٿيل ثالث، ۽ سينيئر ADR پيشيور آهي، جنهن کي ايڊمرلٽي ۽ ميري ٽائيم لا، سول قانوني چارا جوئي، تجارتي تڪرارن، ۽ بين الاقوامي واپاري معاملن ۾ وسيع مهارت حاصل آهي. پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي صدر جي حيثيت سان، هو ثالثي جي طريقن کي مضبوط ڪرڻ ۽ پاڪستان ۾ ادارتي تڪرارن جي حل جي فريم ورڪ کي فروغ ڏيڻ ۾ اهم ڪردار ادا ڪري رهيو آهي.\n\nهو هڪ سي اي ڊي آر (CEDR UK) تسليم ٿيل ثالث آهي ۽ هاءِ ڪورٽ آف سنڌ جي پينل تي بطور ثالث خدمتون سرانجام ڏيندو آهي، جڏهن ته مصالحه انٽرنيشنل سينٽر فار ADR (MICADR) سان پڻ وابسته آهي. پنهنجي قانوني پريڪٽس کان علاوه، هن هڪ وزٽنگ فيڪلٽي ميمبر ۽ ادارتي اڳواڻ طور قانوني تعليم ۽ پيشيورانه ترقيءَ ۾ حصو ورتو آهي.",
    "badges": ["ماسٽر ٽرينر", "صدر", "ايگزیکٽو ليڊرشپ"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "تجارتي تڪرارن جو حل", "ايڊمرلٽي ۽ ميري ٽائيم لا", "بين الاقوامي واپاري تڪرار", "آربٽريشن ۽ تڪرارن جو حل", "سول ۽ ڪارپوريٽ قانوني چارا جوئي", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "21+ سال", "label": "قانون جي پريڪٽس ۽ تڪرارن جو حل" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "پينل ميڊيئيٽر – هاءِ ڪورٽ آف سنڌ", "ميمبر – مصالحه انٽرنيشنل سينٽر فار ADR (MICADR)", "بين الاقوامي ثالثي قانون ۾ ڊپلوما – انگلينڊ ۽ ويلز"],
    "education": ["بين الاقوامي ثالثي قانون ۾ ڊپلوما – ڪالج آف لا، انگلينڊ ۽ ويلز"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "مصلحه انٽرنيشنل سينٽر فار ADR (MICADR)", "هاءِ ڪورٽ آف سنڌ", "سپريم ڪورٽ بار ايسوسييشن آف پاڪستان", "سنڌ هاءِ ڪورٽ بار ايسوسييشن", "بحريا يونيورسٽي"],
    "media": []
  },
  "trainer_mustansir_zakir": {
    "name": "مستنصر ذاڪر",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"اسٽريٽجڪ قيادت ۽ ADR جي فضيلت ذريعي ڪارپوريٽ گورننس ۽ ثالثي جي تربيت جي قدمن جي قيادت ڪرڻ.\"",
    "about": "مستنصر ذاڪر هڪ سينيئر ڪارپوريٽ اڳواڻ، تسليم ٿيل ثالث، ۽ بين الاقوامي سطح تي تسليم ٿيل ADR ٽرينر آهي، جنهن کي اسٽريٽجڪ مينيجمينٽ، ڪارپوريٽ گورننس ۽ تڪرارن جي حل جو وسيع تجربو حاصل آهي. هو پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جو ڊائريڪٽر ٽريننگ ۽ ايگزیکٽو ميمبر طور خدمتون سرانجام ڏيندو آهي ۽ پاڪستان ۾ ثالثي ۽ ADR جي آگاهي کي فروغ ڏيڻ ۾ اهم ڪردار ادا ڪيو اٿس.\n\nهو ICAP، ICMAP، ۽ ICSP جو فيلو ميمبر آهي، ۽ هن وقت ه thoseو گروپ سان بطور چيف ايگزیکٽو ڪم ڪري رهيو آهي. هن ڪارنيل يونيورسٽي، آمريڪا مان اسٽريٽجڪ مينيجمينٽ سرٽيفڪيشن ۽ پاڪستان انسٽيٽيوٽ آف ڪارپوريٽ گورننس مان سرٽيفائيڊ ڊائريڪٽر ايجوڪيشن مڪمل ڪئي آهي. هڪ سي اي ڊي آر يوڪي تسليم ٿيل ثالث ۽ ماسٽر ٽرينر جي حيثيت سان، هن پاڪستان ۾ پيشيورانه ثالثي جي تربيت، قيادت جي ترقي، ۽ ادارتي ADR قدمن ۾ وڏي پيماني تي تعاون ڪيو آهي.",
    "badges": ["ماسٽر ٽرينر", "ڊائريڪٽر ٽريننگ", "ايگزیکٽو ڪميٽي – سائوٿ", "سابق صدر"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "ڪارپوريٽ گورننس", "اسٽريٽجڪ مينيجمينٽ", "ايگزیکٽو ليڊرشپ ڊيولپمينٽ", "تجارتي تڪرارن جو حل", "ٽرين دي ٽرينر (TOT)", "ادارو ورتا صلاحيتن جي تعمير"],
    "experience": { "years": "20+ سال", "label": "ايگزیکٽو ليڊرشپ ۽ ADR ٽريننگ" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "سرٽيفائيڊ ڊائريڪٽر – پاڪستان انسٽيٽيوٽ آف ڪارپوريٽ گورننس", "اسٽريٽجڪ مينيجمينٽ سرٽيفڪيشن – ڪارنيل يونيورسٽي، آمريڪا"],
    "education": ["فيلو – انسٽيٽيوٽ آف چارٽرڊ اڪائونٽنٽس آف پاڪستان (ICAP)", "فيلو – انسٽيٽيوٽ آف ڪاسٽ اينڊ مينيجمينٽ اڪائونٽنٽس آف پاڪستان (ICMAP)", "فيلو – انسٽيٽيوٽ آف ڪارپوريٽ سيڪريٽريز آف پاڪستان (ICSP)"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "هاشو گروپ", "پاڪستان هوٽلز ايسوسييشن (PHA)", "ايسوسييشن آف بلڊرز اينڊ ڊيولپرز آف پاڪستان (ABAD)", "انسٽيٽيوٽ آف چارٽرڊ اڪائونٽنٽس آف پاڪستان (ICAP)", "پاڪستان انسٽيٽيوٽ آف ڪارپوريٽ گورننس", "ڪراچي سي اسڪائوٽ ڪائونسل ٽرسٽ"],
    "media": []
  },
  "trainer_wajiha_aleem": {
    "name": "وجيهه عليم",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"پاڪستان ۾ هڪ مضبوط ADR فريم ورڪ لاءِ قيادت, جدت، ۽ بين الاقوامي تعاون ذريعي ثالثي کي اڳتي وڌائڻ.\"",
    "about": "وجيهه عليم هاءِ ڪورٽ جي وڪيل، تسليم ٿيل ثالث، ۽ قانوني پيشيور آهي، جنهن کي ڪارپوريٽ آپريشنز، قانوني مشاورت، ۽ متبادل حلِ تڪرار (ADR) جو وسيع تجربو آهي. هوءَ هن وقت پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي سڪريٽري جنرل طور خدمتون سرانجام ڏئي رهي آهي ۽ گڏوگڏ هاشو گروپ ۾ جنرل مينيجر (آپريشنز ۽ ليگل) جي عهدي تي فائز آهي.\n\nهن يونائيٽيڊ ڪنگڊم مان انٽرنيشنل ڪمرشل لا اينڊ متبادل حلِ تڪرار (ADR) ۾ ايل ايل ايم ڪيو آهي ۽ هوءَ هڪ سي اي ڊي آر تسليم ٿيل ثالث آهي، جنهن جي بين الاقوامي وابستگين ۾ ٿائلينڊ آربٽريشن سينٽر (THAC) شامل آهي. هوءَ هاءِ ڪورٽ آف سنڌ ۾ بطور ثالث پينل ۾ شامل آهي ۽ قومي توڙي بين الاقوامي سطح تي معروف قانوني ۽ پيشيورانه تنظيمن سان سرگرم عمل آهي.",
    "badges": ["ماسٽر ٽرينر", "سڪريٽري جنرل", "ايگزیکٽو ليڊرشپ"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "بين الاقوامي تجارتي قانون", "ڪارپوريٽ قانوني مشاورت", "تجارتي تڪرارن جو حل", "ادارو ورتا ADR ترقي", "پيشيورانه مهارتن جي تربيت", "تڪرارن جو حل"],
    "experience": { "years": "17+ سال", "label": "ڪارپوريٽ، قانوني ۽ ADR ليڊرشپ" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث", "پينل ميڊيئيٽر – هاءِ ڪورٽ آف سنڌ", "ايسوسيئيٽ ٽرينر – پي ايم اي", "ٽي ايڇ اي سي (THAC) چيپٽر وابستگي – ٿائلينڊ آربٽريشن سينٽer"],
    "education": ["انٽرنيشنل ڪمرشل لا ۽ ADR ۾ ايل ايل ايم – يونائيٽيڊ ڪنگڊم", "بي اي، ايل ايل بي (Hons) – پاڪستان"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "ٿائلينڊ آربٽريشن سينٽر (THAC)", "هاءِ ڪورٽ آف سنڌ", "سنڌ بار ڪائونسل", "ڪراچي بار ايسوسييشن", "انٽرنيشنل بار ايسوسييشن", "هاشو گروپ"],
    "media": []
  },
  "trainer_huma_shah": {
    "name": "هما شاه",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"قيادت، وکالت ۽ پيشيورانه رهنمائي ذريعي ڪارپوريٽ قانوني فضيلت ۽ ثالثي جي تربيت کي اڳتي وڌائڻ.\"",
    "about": "هما شاه هڪ انتهائي تجربيڪار قانوني پيشيور، ڪارپوريٽ مشير، ۽ تسليم ٿيل ADR ٽرينر آهي، جنهن جي قانوني پريڪٽس ٽن ڏهاڪن کان وڌيڪ آهي. 1993 کان، هن پاڪستان جي ڪجهه نمايان قانوني ادارن بشمول اي جي ايڇ ايس (AGHS) ليگل ائڊ سيل، محترمه عاصما جهانگير ۽ محترمه حنا جيلاني جي ماتحت اي جي ايڇ ايس لا ايسوسيئيٽس، ۽ ميسرز سريج اينڊ بيچينو سان ڪم ڪيو آهي.\n\nهوءَ ميسرز شيخ شاه رانا اينڊ اعجاز (SSR&I) ۾ مينيجنگ پارٽنر طور خدمتون سرانجام ڏئي چڪي آهي ۽ هن وقت ايڇ بي ايل (HBL) ۾ ليگل هيڊ – نارتھ طور خدمتون سرانجام ڏئي رهي آهي. هوءَ بار ڪائونسل آف انگلينڊ اينڊ ويلز جي انز آف ڪورٽ ايڊوڪيسي ڪميٽي (IATC) جي تحت ايڊوڪيسي ٽريننگ پروگرام پاڪستان جي هڪ تسليم ٿيل ٽرينر آهي، ۽ هڪ سي اي ڊي آر يوڪي تسليم ٿيل ثالث ۽ ماسٽر ٽرينر آهي.",
    "badges": ["ماسٽر ٽرينر", "ايگزیکٽو ڪميٽي – نارتھ", "ٽريننگ ڪميٽي"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "ڪارپوريٽ ۽ تجارتي قانون", "ايڊوڪيسي ۽ قانوني مهارتن جي تربيت", "معاهدي جي ڊرافٽنگ ۽ ويٽنگ", "بينڪنگ ۽ ڪارپوريٽ قانوني مشاورت", "تڪرارن جو حل", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "30+ سال", "label": "قانوني پريڪٽس، ڪارپوريٽ ايڊوائزري ۽ ADR ٽريننگ" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "تسليم ٿيل ٽرينر – ايڊوڪيسي ٽريننگ پروگرام پاڪستان (IATC)"],
    "education": ["پنجاب لا ڪاليج – تعليمي ميرٽ لاءِ ٻه ڀيرا گولڊ ميڊل سان نوازيو ويو"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "انز آف ڪورٽ ايڊوڪيسي ڪميٽي (IATC)", "بار ڪائونسل آف انگلينڊ اينڊ ويلز", "حبيب بئنڪ لميٽيڊ (HBL)", "پنجاب بار ايسوسييشنز", "اي جي ايڇ ايس ليگل ائڊ سيل", "ميسرز سريج اينڊ بيچينو"],
    "media": []
  },
  "trainer_usman_g_rashid": {
    "name": "عثمان جي راشد",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"پاڪستان ۾ اي ڊي آر جي صلاحيت پيدا ڪرڻ لاءِ قانوني وڪالت، ثالثي جي مهارت، ۽ تربيتي قيادت کي گڏ ڪرڻ.\"",
    "about": "عثمان جي راشد هڪ بيرسٽر ايٽ لا، هاءِ ڪورٽس جو وڪيل، سي اي ڊي آر تسليم ٿيل ثالث، ۽ ماسٽر ٽرينر آهي، جنهن کي قانوني پريڪٽس، ايڊوڪيسي ٽريننگ، ثالثي ۽ قانوني تعليم جو وسيع تجربو آهي. هن يونيورسٽي آف لنڊن مان ايل ايل بي (Hons)، ڪنگز ڪاليج لنڊن مان ايل ايل ايم ڪيو، ۽ يونيورسٽي آف دي ويسٽ آف انگلينڊ، برسٽل، يوڪي مان بار ووڪيشنل ڪورس مڪمل ڪيو. کيس آنريبيل سوسائٽي آف لنękiز ان پاران بار ۾ گهرايو ويو هو.\n\nهو ان کان اڳ پا Malkanstan ميڊيئيٽرز ايسوسييشن (PMA) جو نائب صدر ۽ ايگزيڪيوٽو ڪميٽي جو ميمبر رهيو آهي، ۽ هن وقت ايڊوڪيسي ٽريننگ پروگرام پاڪستان (IATC) جي تحت ايڊوڪيسي ٽريننگ پروگرام لاءِ تسليم ٿيل ٽرينر آهي. هو پاڪستان ۾ ثالثي جي تربيت، قانوني تعليم، ۽ پيشيورانه ترقيءَ کي اڳتي وڌائڻ لاءِ سرگرم آهي.",
    "badges": ["ماسٽر ٽرينر", "ايگزيڪيوٽو ڪميٽي – سائوٿ", "ٽريننگ ڪميٽي", "ايڊوڪيسي ٽريننگ پروگرام پاڪستان (IATC) جي تسليم ٿيل ٽرينر"],

    "expertise": ["ADR ۽ ثالثي جي تربيت", "ايڊوڪيسي اسڪلز ٽريننگ", "ڪمپني لا", "قانونِ شهادت (Law of Evidence)", "تجارتي ۽ سول قانوني چارا جوئي", "قانوني تعليم ۽ پيشيورانه ترقي", "تڪرارن جو حل"],
    "experience": { "years": "15+ سال", "label": "سي اي ڊي آر تسليم ٿيل ماسٽر ٽرينر، ايڊوڪيسي ۽ قانوني تعليم" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث ۽ ماسٽر ٽرينر – يوڪي", "بيرسٽر ايٽ لا – لنڪنز ان", "سرٽيفائيڊ ايڊوڪيسي ٽرينر"],
    "education": ["ايل ايل ايم – ڪنگز ڪاليج، يونيورسٽي آف لنڊن", "ايل ايل بي (Hons) – يونيورسٽي آف لنڊن", "بار ووڪيشنل ڪورس – يونيورسٽي آف دي ويسٽ آف انگلينڊ، برسٽل، يوڪي."],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوٿكی", "معزز سوسائٽي آف لنڬنز ان", "يونиورسٽي ڪاليج لاهور", "يونиورسٽי آف لنڬن ايڬسٽرنل پروگرام", "عنايت الله چيمبرز، ايڊووڌتس اينڊ ليگل ڪنسلٽنٽس"],
    "media": []
  },
  "trainer_asfand_yar_ali_khan": {
    "name": "اسفند يار علي خان",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"قيادت، تربيت ۽ ادارتي مهارت ذريعي ثالثي، آربٽريشن ۽ قانوني سڌارن کي اڳتي وڌائڻ.\"",
    "about": "اسفند يار علي خان هڪ سينيئر قانوني پريڪٽيشنر، تسليم ٿيل ثالث، ۽ بين الاقوامي سطح تي تربيت يافته ADR ماهر آهي، جنهن کي قانوني مشاورت, آربٽريشن، ادارتي ترقي، ۽ ثالثي جي تربيت جو وسيع تجربو حاصل آهي. ايس اينڊ ڪي پارٽنرشپ ۾ سينيئر پارٽنر ۽ پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي نائب صدر جي حيثيت سان، هو پاڪستان ۾ ثالثي ۽ متبادل حلِ تڪرار جي فريم ورڪ کي مضبوط ڪرڻ ۾ سرگرم حصو وٺندو آهي.\n\nلنڪنز ان، لنڊن پاران بار ۾ گهرايو ويو، هو هڪ سي اي ڊي آر يوڪي تسليم ٿيل ثالث ۽ ماسٽر ٽرينر آهي ۽ چارٽرڊ انسٽيٽيوٽ آف آربٽريٽرز (MCIArb)، لنڊن جو ميمبر آهي. هن جو پيشيورانه پس منظر قانوني پريڪٽس، بين الاقوامي ترقياتي قدمن، پاليسي لاڳاپن، ۽ ادارتي مشورتي ڪردارن تي مشتمل آهي، جنهن ۾ گڏيل قومن ۽ يو اين ڊي پي (UNDP) جي منصوبن سان ڪم شامل آهي.",
    "badges": ["ماسٽر ٽرينر", "ايگزیکٽو ليڊرشپ", "نائب صدر – نارتھ"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "آربٽريشن ۽ تڪرارن جو حل", "تجارتي ۽ سول تڪرار", "قانوني مهارتن جي ترقي", "ادارو ورتا ADR صلاحيت سازي", "پيشيورانه ترقي جا پروگرام", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "20+ سال", "label": "قانون جي پريڪٽس، ADR ۽ ٽريبيونل قيادت" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "ميمبر – چارٽرڊ انسٽيٽيوٽ آف آربٽريٽرز (MCIArb)، لنڊن", "بيرسٽر ايٽ لا – لنڪنز ان، لنڊن"],
    "education": ["پوسٽ گريجوئيٽ ڊپلوما ان پروفيشنل ليگل اسڪلز – يوڪي", "ايل ايل بي (Hons) – يوڪي", "ایم اي – پاڪستان", "بي اي – پاڪستان"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "چارٽرڊ انسٽيٽيوٽ آف آربٽريٽرز، لنڊن", "لنڪنز ان، لنڊن", "پاڪستان ريڊ ڪريسينٽ سوسائٽي (PRCS)", "پاڪستان انوائرنمينٽل لا ايسوسييشن", "برٽش ايلومنائي ايسوسييشن", "گڏيل قومن جا ترقياتي قدم"],
    "media": []
  },
  "trainer_saima_amin_khawaja": {
    "name": "سائمه امين خواجه",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"تعليم ۽ ادارتي قيادت ذريعي قانوني سڌارن، ثالثي جي فضيلت، ۽ پائيدار حلِ تڪرار کي فروغ ڏيڻ.\"",
    "about": "سائمه امين خواجه هڪ ماهر قانوني پيشيور، تسليم ٿيل ثالث، ۽ بين الاقوامي سطح تي تربيت يافته ADR ماهر آهي، جنهن کي ڪارپوريٽ قانوني چارا جوئي، آئيني قانون، قانوني مشاورت، ۽ ادارتي سڌارن جو وسيع تجربو حاصل آهي. هن پاڪستان ۾ ثالثي جي آگاهي، اي ڊي آر جي تربيت، ۽ قانوني ترقيءَ جي قدمن کي اڳتي وڌائڻ ۾ اهم ڪردار ادا ڪيو آهي.\n\nهن ڪنگز ڪاليج لنڊن مان ايل ايل ايم (LL.M) ڪيو آهي ۽ ايم سي مهتا فائونڊيشن، انڊيا مان ماحولياتي قوانين ۾ خاص تربيت حاصل ڪئي اٿس. سي اي ڊي آر يوڪي (CEDR UK) تسليم ٿيل ثالث ۽ ماسٽر ٽرينر جي حيثيت سان، هن پيشيورانه ثالثي جي تربيت ۽ صلاحيت سازي جي پروگرامن ۾ سرگرميءَ سان حصو ورتو آهي. هن لمز (LUMS)، سول سروسز اڪيڊمي، جوڊيشل اڪيڊمي، ٽيلز (TILS)، ۽ يو سي ايل (UCL) ۾ پڙهايو آهي، جڏهن ته لاهور هاءِ ڪورٽ پاران جوڙيل ڪلائميٽ چينج ڪميشن جي ميمبر طور پڻ خدمتون سرانجام ڏنيون اٿس.",
    "badges": ["ماسٽر ٽرينر", "ايگزیکٽو ميمبر", "نائب صدر – نارتھ"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "ڪارپوريٽ ۽ آئيني قانون", "قانوني سڌارا ۽ پاليسي ترقي", "ماحولياتي قانون", "عدالتي ۽ پيشيورانه تربيت", "تڪرارن جو حل", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "20+ سال", "label": "قانون جي پريڪٽس, ٽريننگ ۽ ڪنسلٽنسي" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "ماحولياتي قانون جي خاص تربيت – ايم سي مهتا فائونڊيشن، انڊيا"],
    "education": ["ايل ايل ايم (LL.M) – ڪنگز ڪاليج لنڊن"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "لاهور هاءِ ڪورٽ", "لاهور يونيورسٽي آف مينيجمينٽ سائنسز (LUMS)", "سول سروسز اڪيڊمي", "جوڊيشل اڪيڊمي", "ٽيلز (TILS)", "يونيورسٽي ڪاليج لاهور (UCL)", "ايم سي مهتا فائونڊيشن، انڊيا"],
    "media": []
  },
  "trainer_tariq_saeed_rana": {
    "name": "طارق سعيد رانا",
    "role": "ماسٽر ٽرينر",
    "highlight": "\"بين الاقوامي مهارت، پيشيورانه تربيت ۽ ADR قيادت ذريعي ڪارپوريٽ قانوني پريڪٽس ۽ ثالثي جي فضيلت جي اڳواڻي ڪرڻ.\"",
    "about": "طارق سعيد رانا هڪ سينيئر قانوني مشير، تسليم ٿيل ثالث، ۽ بين الاقوامي سطح تي مڃيل ADR ٽرينر آهي، جنهن کي ڪارپوريٽ ۽ تجارتي قانون ۾ وسيع مهارت حاصل آهي. سوسائٽي آف لنڪنز ان، يوڪي پاران بار ۾ گهرايو ويو، هو هن وقت سريج اينڊ بيچينو ۾ ڪارپوريٽ ۽ ڪمرشل لا ڊويزن جو سربراهه آهي ۽ پاڪستان ۾ ثالثي جي تربيت، قانوني مشاورت، ۽ ادارتي ADR جي ترقيءَ ۾ اهم حصو وجهي رهيو آهي.\n\nهو هڪ سي اي ڊي آر يوڪي تسليم ٿيل ثالث ۽ ماسٽر ٽرينر آهي، جنهن کي ڪارپوريٽ گورننس، قانوني مشاورت، ۽ پيشيورانه صلاحيت سازي جو وسيع تجربو آهي. هو سرگرميءَ سان پيشيورانه ۽ ڊائريڪٽرز جي ٽريننگ پروگرامن جي اڳواڻي ڪندو آهي.",
    "badges": ["ماسٽر ٽرينر", "سابق صدر", "ايگزیکٽو ڪميٽي – نارتھ"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "ڪارپوريٽ ۽ تجارتي قانون", "ڊائريڪٽرز ٽريننگ پروگرام", "ڪارپوريٽ گورننس", "تجارتي تڪرارن جو حل", "پيشيورانه قانوني ترقي", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "25+ سال", "label": "قانون جي پريڪٽس، ADR ۽ ڪارپوريٽ ايڊوائزري" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "بار ۾ گهرايو ويو – لنڪنز ان، يوڪي"],
    "education": ["ڪمرشل لاز ۾ ايل ايل ايم – يونائيٽيڊ ڪنگڊم", "پوسٽ گريجوئيٽ ڊپلوما ان لا – يونائيٽيڊ ڪنگڊم", "ايل ايل بي – پاڪستان", "ايسوسيئيٽ انجنيئرنگ (ميڪانائيڪل) – پاڪستان"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "معزز سوسائٽي آف لنڪنز ان، لنڊن", "جنرل ڪائونسل آف دي بار آف انگلينڊ اينڊ ويلز", "لاهور هاءِ ڪورٽ بار ايسوسييشن", "پنجاب بار ڪائونسل", "لاهور چيمبر آف ڪامرس اينڊ انڊسٽري", "ميسرز سريج اينڊ بيچينو"],
    "media": []
  },
  "saeed_habib": {
    "name": "سعيد حبيب",
    "role": "نائب صدر – سائوٿ",
    "highlight": "",
    "about": "",
    "badges": ["ميمبرشپ ڪميٽي", "ادارو ورتا هم آهنگي"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "shabana_ali": {
    "name": "شبانو علي",
    "role": "نائب صدر – سائوٿ",
    "highlight": "\"وڪالت، تعليم ۽ تڪرارن جي حل ذريعي ثالثي، قانوني آگاهي ۽ سماجي انصاف کي فروغ ڏيڻ.\"",
    "about": "محترمه شبانو علي پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي نائب صدر (سائوٿ) آهي ۽ سول، ٽيڪس، ۽ ڪارپوريٽ معاملن جي هڪ تجربيڪار وڪيل آهي، جنهن کي قانوني چارا جوئي، مشاورتي خدمتن ۽ تڪرارن جي حل جو مضبوط پس منظر حاصل آهي. هوءَ پاڪستان ۾ ثالثي جي طريقن کي مضبوط ڪرڻ ۾ سرگرم آهي ۽ قانوني بااختياريءَ، سماجي انصاف ۽ عورتن توڙي ٻارن جي حقن جي تحفظ لاءِ سڃاتي وڃي ٿي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "پي ايم اي تسليم ٿيل ثالث", "بار ڪوآرڊينيشن – سائوٿ", "ليڊرشپ"],
    "expertise": ["سول لا", "ڪارپوريٽ لا", "خانداني تڪرار", "ٽيڪس لا", "ثالثي ۽ ADR", "عورتن ۽ ٻارن جي حقن جي وڪالت"],
    "experience": { "years": "20+ سال", "label": "قانون جي پريڪٽس، ثالثي ۽ عوامي وڪالت" },
    "accreditations": ["پي ايم اي تسليم ٿيل ثالث", "سرٽيفائيڊ ميڊيئيشن پريڪٽيشنر"],
    "education": ["سول، ڪارپوريٽ ۽ ٽيڪس لا ۾ قانوني ۽ پيشيورانه تعليم"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن", "پاڪستان انسٽيٽيوٽ آف پبلڪ فنانس اڪائونٽنٽس (PIPFA)", "ايگزیکٽو ڪميٽي – PMA", "ميڊيا ليگل اينالسٽ ۽ اسپيڪر"],
    "media": ["پاڪستان ٽيليويزن ڪارپوريشن (PTV)", "آج نيوز", "ٽي وي ون", "ميٽرو نيوز"]
  },
  "syed_sammad_ul_haque": {
    "name": "سيد صمد الحق",
    "role": "فنانس سڪريٽري",
    "highlight": "",
    "about": "",
    "badges": ["ميمبرشپ ڪميٽي", "ايگزیکٽو ليڊرشپ"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "tariq_saeed_rana": {
    "name": "طارق سعيد رانا",
    "role": "ايگزیکٽو ڪميٽي – نارتھ",
    "highlight": "\"بين الاقوامي مهارت، پيشيورانه تربيت ۽ ADR قيادت ذريعي ڪارپوريٽ قانوني پريڪٽس ۽ ثالثي جي فضيلت جي اڳواڻي ڪرڻ.\"",
    "about": "بيرسٽر طارق سعيد رانا هڪ سينيئر قانوني پيشيور، تسليم ٿيل ثالث، ۽ ماسٽر ٽرينر آهي، جنهن کي ڪارپوريٽ ۽ تجارتي قانون ۾ وسيع مهارت حاصل آهي. سوسائٽي آف لنڪنز ان، يوڪي پاران بار ۾ گهرايو ويو، هو هن وقت سريج اينڊ بيچينو ۾ ڪارپوريٽ ۽ ڪمرشل لا ڊويزن جو سربراهه آهي. قانوني مشاورت، اي ڊي آر، ۽ پيشيورانه تربيت ۾ ڏهاڪن جي تجربي سان، هو پاڪستان ۾ ثالثي ۽ ادارتي قانوني ترقيءَ کي اڳتي وڌائڻ ۾ اهم ڪردار ادا ڪري رهيو آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر تسليم ٿيل ثالث", "ماسٽر ٽرينر", "سابق صدر"],
    "expertise": ["Kارپوريٽ ۽ تجارتي قانون", "ثالثي ۽ ADR", "بين الاقوامي تجارتي تڪرار", "قانوني مشاورت", "ڪارپوريٽ گورننس", "پيشيورانه تربيت"],
    "experience": { "years": "25+ سال", "label": "قانون جي پريڪٽس، ADR ۽ ڪارپوريٽ ايڊوائزري" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث", "سي اي ڊي آر ماسٽر ٽرينر", "بار ۾ گهرايو ويو – لنڪنز ان، يوڪي", "پي ايم اي تسليم ٿيل ثالث"],
    "education": ["ايل ايل ايم (ڪمرشل لاز) – يونائيٽيڊ ڪنگڊم", "پوسٽ گريجوئيٽ ڊپلوما ان لا – يونائيٽيڊ ڪنگڊم", "ايل ايل بي – پاڪستان", "ايسوسيئيٽ انجنيئرنگ (ميڪانائيڪل) – پاڪستان"],
    "affiliations": ["جنرل ڪائونسل آف دي بار آف انگلينڊ اينڊ ويلز", "معزز سوسائٽي آف لنڪنز ان، لنڊن", "پاڪستان ميڊيئيٽرز ايسوسييشن", "لاهور هاءِ ڪورٽ بار ايسوسييشن", "پنجاب بار ڪائونسل", "لاهور چيمبر آف ڪامرس اينڊ انڊسٽري"],
    "media": []
  },
  "huma_shah": {
    "name": "هما شاه",
    "role": "ايگزیکٽو ڪميٽي – نارتھ",
    "highlight": "\"قيادت، وکالت ۽ پيشيورانه رهنمائي ذريعي ڪارپوريٽ قانوني فضيلت ۽ ثالثي جي تربيت کي اڳتي وڌائڻ.\"",
    "about": "محترمه هما شاه هڪ سينيئر قانوني پيشيور آهي، جنهن کي ڪارپوريٽ لا، قانوني مشاورت، تجارتي معاهدن جي ڊرافٽنگ ۽ تڪرارن جي حل جو وسيع تجربو حاصل آهي. 1993 کان پريڪٽس ڪندڙ، هن معروف قانوني ادارن بشمول اي جي ايڇ ايس (AGHS) ليگل ائڊ سيل، اي جي ايڇ ايس لا ايسوسيئيٽس، ۽ سريج اينڊ بيچينو سان ڪم ڪيو آهي. هوءَ هن وقت ايڇ بي ايل (HBL) ۾ ليگل هيڊ – نارتھ طور خدمتون سرانجام ڏئي رهي آهي ۽ پاڪستان ۾ ثالثي جي تربيت ۽ اي ڊي آر جي ترقيءَ ۾ اهم حصو وجهي رهي آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر تسليم ٿيل ثالث", "ماسٽر ٽرينر", "ٽريننگ ڪميٽي"],
    "expertise": ["ڪارپوريٽ ۽ تجارتي قانون", "قانوني مشاورت", "تجارتي ڊرافٽنگ ۽ ويٽنگ", "بينڪنگ ۽ مالي قانوني معاملا", "ثالثي ۽ ADR", "ايڊوڪيسي ٽريننگ"],
    "experience": { "years": "30+ سال", "label": "قانون جي پريڪٽس، ڪارپوريٽ ايڊوائزري ۽ ADR ٽريننگ" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث", "سي اي ڊي آر ماسٽر ٽرينر", "تسليم ٿيل ايڊوڪيسي ٽرينر – IATC (بار ڪائونسل آف انگلينڊ اينڊ ويلز)", "پي ايم اي تسليم ٿيل ثالث"],
    "education": ["پنجاب لا ڪاليج – تعليمي ميرٽ لاءِ ٻه ڀيرا گولڊ ميڊل سان نوازيو ويو"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن", "انز آف ڪورٽ ايڊوڪيسي ٽريننگ پروگرام پاڪستان", "پنجاب بار ايسوسييشنز", "ايڇ بي ايل – ليگل هيڊ نارتھ"],
    "media": []
  },
  "umaimah_anwar_khan": {
    "name": "اميمه انور خان",
    "role": "ايگزیکٽو ڪميٽي – سائوٿ",
    "highlight": "",
    "about": "",
    "badges": ["ضابطه اخلاق", "بار ڪوآرڊينيشن – سائوٿ"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "mustansir_zakir": {
    "name": "مستنصر ذاڪر",
    "role": "ايگزیکٽو ڪميٽي – سائوٿ",
    "highlight": "\"اسٽريٽجڪ قيادت ۽ ADR جي فضيلت ذريعي ڪارپوريٽ governance ۽ ثالثي جي تربيت جي قدمن جي قيادت ڪرڻ.\"",
    "about": "جناب مستنصر ذاڪر هڪ سينيئر ڪارپوريٽ اڳواڻ، تسليم ٿيل ثالث، ۽ ماسٽر ٽرينر آهي، جنهن کي ڪارپوريٽ گورننس، هاسپيٽلٽي، فنانس، ۽ متبادل حلِ تڪرار (ADR) ۾ وسيع قيادتي تجربو آهي. هن وقت هاشو گروپ ۾ بطور چيف ايگزیکٽو خدمتون سرانجام ڏئي رهيو آهي، هن پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جي پليٽ فارم تان پاڪستان ۾ ثالثي جي آگاهي ۽ پيشيورانه تربيت کي فروغ ڏيڻ ۾ اهم ڪردار ادا ڪيو آهي.",
    "badges": ["ايگزیکٽو ٽيم", "ثالث (ميڊيئيٽر)", "سي اي ڊي آر تسليم ٿيل ثالث", "ڊائريڪٽر ٽريننگ", "ماسٽر ٽرينر", "سابق صدر"],
    "expertise": ["ڪارپوريٽ گورننس", "اسٽريٽجڪ مينيجمينٽ", "ثالثي ۽ ADR ٽريننگ", "هاسپيٽلٽي ۽ بزنس ليڊرشپ", "مالي مينيجمينٽ", "ادارو ورتا ترقي"],
    "experience": { "years": "30+ سال", "label": "ڪارپوريٽ ليڊرشپ، گورننس ۽ ADR" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث", "سي اي ڊي آر ماسٽر ٽرينر", "سرٽيفائيڊ ڊائريڪٽر ايجوڪيشن – PICG", "اسٽريٽجڪ مينيجمينٽ سرٽيفڪيشن – ڪارنيل يونيورسٽي، آمريڪا"],
    "education": ["فيلو – انسٽيٽيوٽ آف چارٽرڊ اڪائونٽنٽس آف پاڪستان (ICAP)", "فيلو – انسٽيٽيوٽ آف ڪاسٽ اينڊ مينيجمينٽ اڪائونٽنٽس آف پاڪستان (ICMAP)", "فيلو – انسٽيٽيوٽ آف ڪارپوريٽ سيڪريٽريز آف پاڪستان (ICSP)"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (سابق صدر ۽ ڊائريڪٽر ٽريننگ)", "هاشو گروپ – چيف ايگزیکٽو", "پاڪستان هوٽلز ايسوسييشن (سابق چيئرمين)", "ايسوسييشن آف بلڊرز اينڊ ڊيولپرز آف پاڪستان (ABAD)", "ڪراچي سي اسڪائوٽ ڪائونسل ٽرسٽ – مينيجنج ٽرسٽي"],
    "media": []
  },
  "usman_g_rashid": {
    "name": "عثمان جي راشد",
    "role": "ميمبر",
    "highlight": "\"پاڪستان ۾ اي ڊي آر جي صلاحيت پيدا ڪرڻ لاءِ قانوني وڪالت، ثالثي جي مهارت، ۽ تربيتي قيادت کي گڏ ڪرڻ.\"",
    "about": "عثمان جي راشد هڪ بيرسٽر ايٽ لا، هاءِ ڪورٽس جو وڪيل، سي اي ڊي آر تسليم ٿيل ثالث، ۽ ماسٽر ٽرينر آهي، جنهن کي قانوني پريڪٽس، ايڊوڪيسي ٽريننگ، ثالثي ۽ قانوني تعليم جو وسيع تجربو آهي. هن يونيورسٽي آف لنڊن مان ايل ايل بي (Hons)، ڪنگز ڪاليج لنڊن مان ايل ايل م ڪيو، ۽ يونيورسٽي آف دي ويسٽ آف انگلينڊ، برسٽل، يوڪي مان بار ووڪيشنل ڪورس مڪمل ڪيو. کيس آنريبيل سوسائٽي آف لنڪنز ان پاران بار ۾ گهرايو ويو هو.\n\nهو ان کان اڳ پاڪستان ميڊيئيٽرز ايسوسييشن (PMA) جو سڪريٽري جنرل طور خدمتون سرانجام ڏئي چڪو آهي ۽ هن پاڪستان ۾ ثالثي جي آگاهي، اي ڊي آر جي صلاحيت سازي، ۽ پيشيورانه قانوني تربيت جي قدمن ۾ حصو ورتو آهي. پنهنجي قانوني پريڪٽس سان گڏوگڏ، هو يونيورسٽي آف لنڊن جي ايڪسٽرنل پروگرام لاءِ ڪمپني لا ۽ لا آف ايويڊنس پڙهائيندو آهي.\n\nعثمان پنهنجي ڪيريئر جو آغاز عمر بنديال اينڊ ايسوسييٽس سان ڪيو ۽ هن وقت عنايت الله چيمبرز ذريعي پنهنجي پريڪٽس هلوائي ٿو.",
    "badges": ["ثالث (ميڊيئيٽر)", "ماسٽر ٽرينر", "بيرسٽر ايٽ لا"],
    "expertise": ["ADR ۽ ثالثي جي تربيت", "ايڊوڪيسي اسڪلز ٽريننگ", "ڪمپني لا", "قانونِ شهادت (Law of Evidence)", "تجارتي ۽ سول قانوني چارا جوئي", "قانوني تعليم ۽ پيشيورانه ترقي", "تڪرارن جو حل"],
    "experience": { "years": "", "label": "سي اي ڊي آر تسليم ٿيل ثالث ۽ ماسٽر ٽرينر" },
    "accreditations": ["سي اي ڊي آر تسليم ٿيل ثالث ۽ ماسٽر ٽرينر – يوڪي", "بيرسٽر ايٽ لا – لنڪنز ان", "سرٽيفائيڊ ايڊوڪيسي ٽرينر"],
    "education": ["ايل ايل ايم – ڪنگز ڪاليج، يونيورسٽي آف لنڊن", "ايل ايل بي (Hons) – يونيورسٽي آف لنڊن", "بار ووڪيشنل ڪورس – يونيورسٽي آف دي ويسٽ آف انگلينڊ، برسٽل، يوڪي."],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "معزز سوسائٽي آف لنڪنز ان", "يونيورسٽي ڪاليج لاهور", "يونيورسٽي آف لنڊن ايڪسٽرنل پروگرام", "عنايت الله چيمبرز، ايڊووڪيٽس اينڊ ليگل ڪنسلٽنٽس"],
    "media": []
  },
  "adnan_mufti": {
    "name": "عدنان مفتي",
    "role": "ايگزیکٽو ڪميٽي – سائوٿ",
    "highlight": "",
    "about": "",
    "badges": ["ادارو ورتا هم آهنگي", "ليڊرشپ"],
    "expertise": [],
    "experience": { "years": "", "label": "" },
    "accreditations": [],
    "education": [],
    "affiliations": [],
    "media": []
  },
  "anwar_kashif_mumtaz": {
    "name": "انور ڪاشف ممتاز",
    "role": "ماسٽر ٽرينر",
    "highlight": "",
    "about": "انور ڪاشف ممتاز هڪ سينيئر قانوني پيشيور، ليڊرشپ ٽرينر، ۽ تسليم ٿيل ثالث آهي، جنهن کي ڪارپوريٽ، ٽيڪس، ۽ تڪرارن جي حل جي طريقن جو وسيع تجربو آهي. هاءِ ڪورٽ جي وڪيل ۽ سينيئر پارٽنر Saiduddin & Co. جي حيثيت سان، هن پاڪستان ۾ ٽيڪس ۽ ڪارپوريٽ لا ايڊوائزريءَ ۾ هڪ مضبوط سڃاڻپ ٺاهي آهي.\n\nهو ليڊرشپ ۽ پرسنل ڊيولپمينٽ ۾ انٽرنيشنل سرٽيفائيڊ ٽرينر آهي ۽ هڪ سي اي ڊي آر يوڪي تسليم ٿيل ثالث ۽ ماسٽر ٽرينر پڻ آهي. هن پاڪستان ٽيڪس بار ۽ ڪراچي ٽيڪس بار جي سيڪريٽري جنرل، نائب صدر، ۽ صدر طور نمايان عهدن تي پڻ خدمتون سرانجام ڏنيون آهن.",
    "badges": ["ماسٽر ٽرينر", "سابق صدر", "ليڊرشپ ٽرينر"],
    "expertise": ["ليڊرشپ ۽ پرسنل ڊيولپمينٽ", "ADR ۽ ثالثي جي تربيت", "ڪارپوريٽ لا", "ٽيڪس لا ۽ ايڊوائزري", "پيشيورانه ترقي جا پروگرام", "تڪرارن جو حل", "ٽرين دي ٽرينر (TOT)"],
    "experience": { "years": "", "label": "" },
    "accreditations": ["سي اي ڊي آر يوڪي تسليم ٿيل ثالث", "سي اي ڊي آر يوڪي ماسٽر ٽرينر", "سرٽيفائيڊ انٽرنيشنل ٽرينر – ليڊرشپ ۽ پرسنل ڊيولپمينٽ"],
    "education": ["ايڊووڪيٽ، هاءِ ڪورٽ آف پاڪستان"],
    "affiliations": ["پاڪستان ميڊيئيٽرز ايسوسييشن (PMA)", "سي اي ڊي آر يوڪي", "پاڪستان ٽيڪس بار", "ڪراچي ٽيڪس بار", "پبلڪ انٽريسٽ لا ايسوسييشن آف پاڪستان (PILAP)", "ميسرز سعيد الدين اينڊ ڪمپني"],
    "media": []
  }
  },
          "former_presidents": {
            "president_1": {
              "name": "انور ڪاشف ممتاز",
              "title": "سابق صدر"
            },
            "president_2": {
              "name": "مستنصر ذاڪر",
              "title": "سابق صدر"
            },
            "president_3": {
              "name": "ٽارق سعيد رانا",
              "title": "سابق صدر"
            }
          },
          "subcommittee_panel": {
            "header": {
              "title": "ذيلي ڪميٽي",
              "subtitle": "اسان جون ذيلي ڪميٽيون مهارت، گڏيل تعاون ۽ انتھڪ خدمت ذريعي اهم قدمن کي اڳتي وڌائين ٿيون ۽ PMA جي مشن کي سپورٽ ڪن ٿيون.",
              "expand_all": "سڀ کوليو"
            },
            "labels": {
              "mandate": "مينڊيٽ:",
              "director": "ڊائريڪٽر",
              "convener": "ڪنوينر"
            },
            "committees": {
              "training": {
                "title": "ٽريننگ ڪميٽي",
                "mandate": "اورينٽيشن، ٽريننگ، سرٽيفڪيشن/ايڪريڊيشن/ريفريشر ڪورسز/ٽرين دي ٽرينر (TOT)",
                "lead_name": "مستنصر ذاڪر",
                "members": [
                  "انور ڪاشف ممتاز",
                  "سائمه خواجه",
                  "طارق رانا",
                  "هما شاه",
                  "اسفنڊ يار علي خان"
                ]
              },
              "conduct": {
                "title": "ضابطه اخلاق ڪميٽي",
                "mandate": "ثالثن لاءِ ضابطه اخلاق جو مسودو تيار ڪرڻ ۽ سڄي ملڪ ۾ ان جي نفاذ لاءِ قانون واري وزارت کان منظوري حاصل ڪرڻ جي ڪوشش ڪرڻ",
                "lead_name": "اميمه خان",
                "members": [
                  "انور ڪاشف ممتاز",
                  "سائمه خواجه",
                  "خالد محمود",
                  "عدنان مفتي",
                  "طارق رانا",
                  "اسفنڊ يار علي خان"
                ]
              },
              "membership": {
                "title": "رڪنيت ڪميٽي",
                "mandate": "پراڻي رڪنيت کي برقرار رکڻ ۽ فعال ڪرڻ، ٻين ادارن جي تسليم ٿيل ثالثن کي دعوت ڏئي ممبرشپ پورٽ فوليو کي وڌائڻ ۽ ان سان گڏ ايسوسيئيٽ ۽ اعزازي ميمبرن کي شامل ڪرڻ.",
                "lead_name": "سعيد حبيب",
                "members": [
                  "خالد محمود",
                  "سائمه خواجه",
                  "صمد الحق",
                  "اسفنڊ يار علي خان"
                ]
              },
              "bar_south": {
                "title": "قانوني ۽ تعليمي هم آهنگي – ڏکڻ",
                "mandate": "گڏجاڻيون، سيمينار، اورينٽيشنز ۽ ٽريننگ/ورڪشاپس منعقد ڪرڻ لاءِ بار ايسوسيئيشن/بار ڪائونسل ۽ لا اسڪولن سان هم آهنگي",
                "lead_name": "شبانه علي",
                "members": [
                  "سعادت يار خان",
                  "اميمه خان",
                  "محترمه خالد محمود",
                  "صمد الحق",
                  "منصور مير",
                  "نويد احمد"
                ]
              },
              "bar_north": {
                "title": "قانوني ۽ تعليمي هم آهنگي – اتر",
                "mandate": "گڏجاڻيون, سيمينار، اورينٽيشنز ۽ ٽريننگ/ورڪشاپس منعقد ڪرڻ لاءِ بار ايسوسيئيشن/بار ڪائونسل ۽ لا اسڪولن سان هم آهنگي",
                "lead_name": "سائمه خواجه",
                "members": [
                  "ظفر ڪلانوري",
                  "بيرسٽر طارق رانا",
                  "اسفنڊ يار علي خان"
                ]
              },
              "institutional": {
                "title": "ادارتي هم آهنگي ڪميٽي",
                "mandate": "چيمبرز، تجارتي ادارن، پيشه ورانه انجمنن/ادارن سان هم آهنگي",
                "lead_name": "عدنان مفتي",
                "members": [
                  "مستنصر ذاڪر",
                  "سعيد حبيب",
                  "طارق رانا",
                  "اسفنڊ يار علي خان",
                  "صمد الحق"
                ]
              }
            },
            "footer_note": "آغا ظفر احمد (صدر) ۽ وجيهه عليم (سيڪريٽري جنرل) هر ڪميٽي جا ايڪس آفيشيو (Ex. Officio) ميمبر آهن."
          },
          "mediators": {
            "adnan-mufti": { "name": "عدنان مفتي", "role": "ميمبر" },
            "anwar-kashif-mumtaz": { "name": "انور ڪاشف ممتاز", "role": "ميمبر" },
            "ayesha-sarfraz-ali-khan": { "name": "عائشه سرفراز علي خان", "role": "ميمبر" },
            "barrister-tariq-saeed-lahore": { "name": "بيرسٽر طارق سعيد", "role": "ميمبر" },
            "farrukh-junaidy": { "name": "فرخ جنيدي", "role": "ميمبر" },
            "huma-shah": { "name": "هما شاه", "role": "ميمبر" },
            "ishtiaq-memon": { "name": "اشتياق ميمڻ", "role": "ميمبر" },
            "isfandyar-ali-khan": { "name": "اسفنڊ يار علي خان", "role": "ميمبر" },
            "khalid-firoz-arfeen": { "name": "خالد فيروز عارفين", "role": "ميمبر" },
            "khalid-mahmood-siddiqui": { "name": "خالد محمود صديقي", "role": "ميمبر" },
            "mohammad-rehan-siddqui": { "name": "محمد ريحان صديقي", "role": "ميمبر" },
            "mustansir-zakir": { "name": "مستنصر ذاڪر", "role": "ميمبر" },
            "nausheen-ahmed": { "name": "نوشين احمد", "role": "ميمبر" },
            "neelofar-hameed": { "name": "نيلوفر حميد", "role": "ميمبر" },
            "omair-nisar-khan": { "name": "عمير نثار خان", "role": "ميمبر" },
            "raheem-hasnani": { "name": "رحيم حسناني", "role": "ميمبر" },
            "reshma-aftab": { "name": "ريشما آفتاب", "role": "ميمبر" },
            "rubina-virani": { "name": "روبينا ويراني", "role": "ميمبر" },
            "saadat-yar-khan": { "name": "سعادت يار خان", "role": "ميمبر" },
            "saeed-habib": { "name": "سعيد حبيب", "role": "ميمبر" },
            "saima-khawaja": { "name": "سائمه امين خواجه", "role": "ميمبر" },
            "salina-khalfan": { "name": "سالينا خلفان", "role": "ميمبر" },
            "shabana-ali": { "name": "شبانه علي", "role": "ميمبر" },
            "shaheen-premani": { "name": "شاهين بريمڻي", "role": "ميمبر" },
            "syed-haider-imam-rizvi": { "name": "سيد حيدر امام رضوي", "role": "ميمبر" },
            "syed-sammadul-haque": { "name": "سيد صمد الحق", "role": "ميمبر" },
            "tahmasp-r-razvi": { "name": "طهمسپ آر رضوي", "role": "ميمبر" },
            "umaimah-a-rizvi": { "name": "اميمه اي رضوي", "role": "ميمبر" },
            "usman-g-rashid": { "name": "عثمان جي راشد", "role": "ميمبر" },
            "wajiha-aleem": { "name": "وجيهه عليم", "role": "ميمبر" },
            "yousuf-moulvi": { "name": "يوسف مولوي", "role": "ميمبر" },
            "zafar-kalanauri": { "name": "ظفر ڪلانوري", "role": "ميمبر" },
            "zia-makhdoom": { "name": "ضياء مخدوم", "role": "ميمبر" }
          }
        },
        "resources_page": {
          "hero": {
            "image_alt": "سروسز هيرو تصوير",
            "eyebrow": "وسيلا (RESOURCES)",
            "title_line1": "علم. قانون.",
            "title_accent": "اصلاح.",
            "lead_text": "پي ايم اي (PMA) جي اشاعتن، ثالثي جي قانونن، ادارتي دستاويزن، تحقيقي مقالن، وڪالتي وسيلن، ۽ ميڊيا مواد تائين رسائي حاصل ڪريو جيڪي پاڪستان ۾ اي ڊي آر (ADR) ۽ پرامن طريقي سان تڪرارن جي حل کي هٿي ڏين ٿا."
          },
          "tabs": {
            "featured": "نمایاں (خاص)",
            "downloads": "ڊائون لوڊز",
            "mediation_laws": "ثالثي جا قانون",
            "advocacy": "وڪالت ۽ حمايت (Advocacy)",
            "press_media": "پريس ۽ ميڊيا",
            "articles": "مضمون"
          },
          "downloads_panel": {
            "header": {
              "title": "ڊائون لوڊز",
              "lead": "ڊائون لوڊ ڪرڻ جوڳا PDFs، فارم ۽ اشاعتون. فائل کي نئين ٽيب ۾ کولڻ لاءِ ان تي ڪلڪ ڪريو.",
              "view_all_text": "سڀ ڊائون لوڊز ڏسو"
            },
            "global_labels": {
              "download_btn_text": "پي ڊي ايف ڊائون لوڊ ڪريو",
              "default_image_alt": "ADR-ACT-2017 پي ڊي ايف"
            },
            "items": {
              "card_1": {
                "title": "اي ڊي آر ائڪٽ 2017 (ADR-ACT-2017)",
                "file_name": "ADR-ACT-2017.pdf"
              },
              "card_2": {
                "title": "وڪالت ۽ لابي (Advocacy and Lobby)",
                "file_name": "Advocacy-and-Lobby.pdf"
              },
              "card_3": {
                "title": "رجسٽريشن جو سرٽيفڪيٽ",
                "file_name": "Certificate.pdf"
              },
              "card_4": {
                "title": "ميمبرشپ فارم (رڪنيت جو درخواستي فارم)",
                "file_name": "membership-application-form.pdf"
              },
              "card_5": {
                "title": "ميمورنڊم آف ائسوسيئيشن (اپڊيٽ ٿيل)",
                "file_name": "MEMORANDUM-OF-ASSOCIATION-UPDATED.pdf"
              },
              "card_6": {
                "title": "نامزدگي فارم (Nomination)",
                "file_name": "nomination_form.pdf"
              },
              "card_7": {
                "title": "پي ايم اي (PMA) تقرير",
                "file_name": "pma-speech.pdf"
              },
              "card_8": {
                "title": "پي ايم اي ۾ ڇو شامل ٿجي؟",
                "file_name": "Why-Join-PMA.pdf"
              }
            }
          },
          "mediation_laws_panel": {
            "header": {
              "title": "ثالثي جا قانون ۽ قانون سازي",
              "lead": "ثالثي سان لاڳاپيل اهم قانون، بل ۽ سرڪاري قانون سازي جا دستاويز.",
              "view_all_text": "سڀ قانون ڏسو"
            },
            "global_labels": {
              "download_btn_text": "پي ڊي ايف ڊائون لوڊ ڪريو",
              "default_image_alt": "ADR-ACT-2017 پي ڊي ايف"
            },
            "items": {
              "card_1": {
                "title": "اسلام آباد ڊسپيوٽ ريزوليوشن ائڪٽ (ثالثي)",
                "file_name": "Law-Islamabad-Dispute-Resolution-Act-Mediation.pdf"
              },
              "card_2": {
                "title": "ضابطہ ديواني 1908 (CPC) جي پهرين شيڊول ۾ ترميمون",
                "file_name": "Law-KPK-Mediation-Amendment-No.1523-1622_Amendments-in-Frist-Schedule-of-the-code-of-Civil-Procedure-1908_dt-1.pdf"
              },
              "card_3": {
                "title": "ضابطہ ديواني 1908 ۾ پنجاب ترميمون (ثالثي جون شقون)",
                "file_name": "Law-Punjab-Amendments_civil_procedure_1908_final_Mediation_Provisions.pdf"
              },
              "card_4": {
                "title": "ڊرافٽ ضابطہ ديواني (سنڌ ترميم) بل، 2018",
                "file_name": "Law-Sindh-Notification-dt-8-11-2018-The-DRAFT-Code-of-Civil-Procedure-Sindh-Amendment-Bill-2018.pdf"
              },
              "card_5": {
                "title": "ثالثي جي ذريعي فيصلن تي سنگاپور ڪنوينشن (متن)",
                "file_name": "Law-Singapore-Convention-on-Mediated-Settlements-Text.pdf"
              }
            }
          },
          "advocacy_panel": {
            "header": {
              "title": "وڪالت ۽ پاليسي",
              "lead": "اي ڊي آر (ADR) سڌارن جي حمايت لاءِ پاليسي بريفس، وڪالتي ٽول ڪٽس ۽ پوزيشن پيپرز.",
              "view_all_text": "سڀ وڪالتي مواد ڏسو"
            },
            "global_labels": {
              "download_btn_text": "پي ڊي ايف ڊائون لوڊ ڪريو",
              "default_image_alt": "ADR-ACT-2017 پي ڊي ايف"
            },
            "items": {
              "card_1": {
                "title": "خيبر پختونخوا (KPK)",
                "file_name": "kpk.pdf"
              },
              "card_2": {
                "title": "پنجاب",
                "file_name": "punjab.pdf"
              },
              "card_3": {
                "title": "سنڌ",
                "file_name": "sindh.pdf"
              }
            }
          },
          "press_media_panel": {
            "header": {
              "title": "پريس ۽ ميڊيا",
              "lead": "صحافين لاءِ پريس رليز، ميڊيا ڪٽس ۽ ڊائون لوڊ ڪرڻ جوڳو مواد.",
              "view_all_text": "ميڊيا مواد ڏسو"
            },
            "global_labels": {
              "download_btn_text": "پي ڊي ايف ڊائون لوڊ ڪريو",
              "default_image_alt": "پي ڊي ايف"
            },
            "items": {
              "card_1": {
                "title": "بزنس رڪارڊر (Business Recorder)",
                "file_name": "BusinessRecorder.pdf"
              },
              "card_2": {
                "title": "بزنس رڪارڊر اشتهار (AD)",
                "file_name": ""
              },
              "card_3": {
                "title": "فرنٽيئر پوسٽ (Frontier Post)",
                "file_name": "FrontierPost.pdf"
              },
              "card_4": {
                "title": "پاڪستان آبزرور (Pakistan Observer)",
                "file_name": "PakistanObserver.pdf"
              },
              "card_5": {
                "title": "پي ايم اي (PMA) پريس رليز",
                "file_name": "PMA_PressRelease.pdf"
              },
              "card_6": {
                "title": "ٽريبون (Tribune)",
                "file_name": "Tribune.pdf"
              }
            }
          },
          "articles_panel": {
            "header": {
              "title": "مضمون ۽ تجزيو",
              "lead": "ثالثي ۽ اي ڊي آر (ADR) تي تحقيقي مضمون، تجزيا ۽ فڪري اڳواڻي.",
              "view_all_text": "سڀ مضمون ڏسو"
            },
            "global_labels": {
              "download_btn_text": "پي ڊي ايف ڊائون لوڊ ڪريو",
              "author_prefix": "طرفان"
            },
            "items": {
              "card_1": {
                "title": "It Really Happened in Frankfurt",
                "author": "جواد اي سرواڻا",
                "file_name": "blog-Jawad-Sarwana-It-Happened-in-Frankfurt.pdf",
                "image_alt": "It Really Happened in Frankfurt پي ڊي ايف"
              },
              "card_2": {
                "title": "Mediation Techniques",
                "author": "جواد اي سرواڻا",
                "file_name": "Blog-Sarwana.pdf",
                "image_alt": "Mediation Techniques پي ڊي ايف"
              }
            }
          },
          "search_bar": {
            "question": "ڇا توهان کي پنهنجي گهربل شيءِ نه پئي ملي؟",
            "subtext": "وسيلا تيزي سان ڳولهڻ لاءِ سرچ استعمال ڪريو يا ڪيٽيگري جي حساب سان برائوز ڪريو.",
            "placeholder": "وسيلا ڳوليو...",
            "browse_btn_text": "سڀ وسيلا برائوز ڪريو"
          }
        },
        "events_page": {
          "hero_section": {
            "eyebrow": "ايونٽس",
            "title": "ايونٽس ۽ تقريبون",
            "lead": "پي ايم اي (PMA) جي ڪانفرنسن، ثالثي جي قدمن، ورڪشاپس ۽ اهم اعلانن کان باخبر رهو.",
            "image_alt": "ايونٽس هيرو تصوير"
          },
          "tab_bar": {
            "upcoming_events": "ايندڙ ايونٽس",
            "past_events": "گذريل ايونٽس",
            "announcements": "اعلان ۽ نوٽيس"
          },
          "upcoming_panel": {
            "title": "جلد اچي رهيو آهي",
            "lead": "ايندڙ ايونٽس، ڪانفرنسون ۽ ورڪشاپون هتي ڏيکاريون وينديون. جلد ئي ٻيهر چيڪ ڪريو."
          },
          "announcements_panel": {
            "title": "جلد اچي رهيو آهي",
            "lead": "اهم اعلان هتي ڏيکاريا ويندا. اسان سان گڏ جڙيل رهو."
          },
          "past_events": {
            "training_program_detail": {
              "global_labels": {
                "badge_text": "گذريل ايونٽ",
                "pill_text": "سرٽيفائيڊ ٽريننگ پروگرام",
                "view_gallery_btn": "ايونٽ گيلري ڏسو",
                "about_label": "ايونٽ بابت",
                "highlights_label": "ٽريننگ جون اهم جھلڪيون"
              },
              "card": {
                "title": "6 هون سرٽيفائيڊ ميڊيائيشن ٽريننگ پروگرام",
                "sub": "سنڌ هاءِ ڪورٽ",
                "date": "08 جون 2026 کان 12 جون 2026",
                "location": "سنڌ هاءِ ڪورٽ، ڪراچي"
              },
              "about_paragraphs": [
                "پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) سنڌ هاءِ ڪورٽ ۾ 6 هون سرٽيفائيڊ ميڊيائيشن ٽريننگ پروگرام ڪاميابي سان منعقد ڪرايو.",
                "هن پروگرام جو مقصد ثالثي جي مهارتن کي مضبوط ڪرڻ، متبادل تڪرارن جي حل (ADR) جي طريقن کي هٿي ڏيڻ، ۽ قانوني ماهرن توڙي ثالثي جي پيشيورن ۾ پيشيورانه صلاحيتن کي وڌائڻ هو.",
                "انٽرايڪٽو سيشنز، عملي مشقن ۽ گڏيل ڳالهين ذريعي، شركت ڪندڙن جديد ثالثي جي طريقن ۽ تڪرارن جي حل واري فريم ورڪ بابت قيمتي ڄاڻ حاصل ڪئي."
              ],
              "highlights": [
                "سرٽيفائيڊ ثالثي تربيتي سيشن",
                "عملي ثالثي جون مشقون",
                "انٽرايڪٽو گروپ بحث",
                "متبادل تڪرارن جي حل (ADR) جون ٽيڪنيڪون",
                "پيشيورانه صلاحيتن جي اڏاوت",
                "گڏجي سکڻ جو ماحول"
              ],
              "meta": {
                "objective_label": "ٽريننگ جو مقصد",
                "objective_text": "ثالثي جي مهارتن کي مضبوط ڪرڻ ۽ تڪرارن جي اثرائتي حل وارن طريقن کي فروغ ڏيڻ.",
                "organized_label": "منتظم",
                "organized_text": "پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA)",
                "participants_label": "شركت ڪندڙ",
                "participants_text": "قانوني پيشيور ماهر، اي ڊي آر (ADR) جا ماهر، ثالث ۽ زير تربيت شركت ڪندڙ.",
                "type_label": "ايونٽ جو قسم",
                "type_text": "سرٽيفائيڊ ٽريننگ پروگرام"
              }
            },
            "national_conference_detail": {
              "global_labels": {
                "badge_text": "گذريل ايونٽ",
                "about_label": "ايونٽ بابت",
                "highlights_label": "نمايان اي ڊي آر (ADR) ترقيون"
              },
              "card": {
                "title": "ثالثي: اڳتي وڌڻ جو رستو (Mediation A Way Forward)",
                "sub": "پهرين نيشنل ميڊيائيشن ڪانفرنس",
                "date": "7 مارچ، 2015",
                "location": "هوتل ميريٽ، ڪراچي",
                "type": "نيشنل ڪانفرنس"
              },
              "about_paragraphs": [
                "پي ايم اي (PMA) پاڪستان جي پهرين تنظيم آهي جيڪا ٻاهرين ملڪن مان تربيت يافته ۽ منظور ٿيل ثالثن سان گڏوگڏ ٻين پيشيورن جي نمائندگي ڪري ٿي، جن ايسوسيئيشن جي مقصدن کي اڳتي وڌائڻ لاءِ ان ۾ شموليت اختيار ڪئي آهي. اها ايسوسيئيشن 2013 ۾ قائم ٿي هئي ۽ ان ڪيتريون ئي سرگرميون پنهنجي ذمي کنيون آهن جيڪي اڳ ۾ آئي ايف سي/ورلڊ بئنڪ گروپ جي متبادل تڪرارن جي حل (ADR) پروجيڪٽ تحت هلي رهيون هيون.",
                "ان ڳالهه کي نظر ۾ رکندي ته پاڪستان ۾ معاهدن جي نفاذ جا اشارا حوصلا افزا نه آهن ۽ ان ۾ ڪيترا ئي سال ۽ وڏي لاڳت اچي ٿي، پي ايم اي انهن قدمن جي اڳواڻي ۽ تعاون جو عزم رکي ٿي جيڪي ڌرين کي دوستاڻي ماحول ۽ ثالثي عمل ذريعي تڪرار حل ڪرڻ جي قابل بڻائيندا، ۽ تڪرارن جي وقتائتي حل ۾ ڪورٽن ۽ عدليه جي ڪوششن جو ساٿ ڏيندا."
              ],
              "highlights": [
                "ڪراچي ۾ 'ڪراچي سينٽر فار ڊسپيوٽ ريزوليوشن' ۽ لاهور ۾ 'لاهور چيمبر آف ڪامرس اينڊ انڊسٽري ميڊيائيشن سينٽر' جو فعال ٿيڻ.",
                "پاڪستان ۾ اي ڊي آر/ثالثي جي قانونن ۾ سڌارن لاءِ ڪوششون ڪرڻ.",
                "پاڪستان ۾ CEDR جي منظور ٿيل ثالثن ۽ ماسٽر ٽرينرز جي موجودگي.",
                "پاڪستان ۾ اي ڊي آر (ADR) جو نصاب تيار ڪرڻ.",
                "پاڪستان ۾ اي ڊي آر ٽريننگز کي مضبوط بڻائڻ ۽ فراهم ڪرڻ.",
                "ڪارپوريٽ گورننس سميت ڪيترن ئي تڪرارن کي حل ڪرڻ لاءِ اي ڊي آر کي هڪ ذريعو طور مڃڻ."
              ],
              "meta": {
                "objective_label": "ڪانفرنس جا مقصد",
                "objective_text": "اي ڊي آر ۽ ثالثي جي مقصد کي اڳتي وڌائڻ ۽ پاڪستان ۾ ثالثي کي ادارتي شڪل ڏيڻ لاءِ اڳڀرائي، چئلينجن ۽ مستقبل جي قدمن تي بحث ڪرڻ.",
                "organized_label": "ڪانفرنس جا ميزبان",
                "organized_text": "هن ڪانفرنس جي ميزباني پاڪستان ميڊيائيٽرز ايسوسيئيشن ڪانفرنس پارٽنرز جي سهڪار سان ڪري رهي آهي.",
                "participants_label": "مقرر ۽ مھمان",
                "participants_text": "حڪومت، عدليه، واپاري برادري، بار، تعليمي ادارن ۽ پاڪستان ۾ ثالثي جي مرڪزن جا نمائندا بشمول پرڏيهي مقرر.",
                "type_label": "ايونٽ جو قسم",
                "type_text": "نيشنل ڪانفرنس"
              }
            }
          }
        },
        "privacy_policy": {
          "hero": {
            "title_main": "پرائيويسي",
            "title_accent": "پاليسي",
            "lead_text": "اسان توهان جي پرائيويسي جي حفاظت ڪرڻ ۽ اهو يقيني بڻائڻ لاءِ پرعزم آهيون ته توهان جي ذاتي معلومات کي محفوظ ۽ ذميواراڻي طريقي سان سنڀاليو وڃي."
          },
          "sections": {
            "commitment": {
              "title": "پرائيويسي جو عزم",
              "paragraphs": [
                "پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) آن لائن توهان جي پرائيويسي جي تحفظ لاءِ پرعزم آهي. پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) پرائيويسي لاءِ پنهنجي پختي عزم کي ظاهر ڪرڻ لاءِ هي پرائيويسي بيان تيار ڪيو آهي. هيٺ ڏنل بيان پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) لاءِ معلومات گڏ ڪرڻ ۽ پکيڙڻ جي طريقيڪار کي واضح ڪري ٿو.",
                "PMA کي ڪنهن به وقت صارفين کي نئين پرائيويسي بيان جي باري ۾ آگاهي ڏئي هن پاليسي کي تبديل ڪرڻ جو حق حاصل آهي. هي بيان ۽ هتي بيان ڪيل پاليسيون ڪنهن به ڌر جي حق ۾ يا ان جي طرفان ڪو معاهدو يا ٻيا قانوني حق پيدا ڪرڻ لاءِ نه آهن ۽ نه ئي ائين ڪن ٿيون."
              ]
            },
            "respect_data": {
              "title": "صارف جي ڊيٽا جو احترام",
              "paragraphs": [
                "پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) پنهنجي ڪسٽمرن سان مضبوط لاڳاپن کي وڏي اهميت ڏئي ٿي. پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) ۾ ڊيٽا گڏ ڪرڻ جي عمل کي اسان جي گراهڪن جي پرائيويسي جي مڪمل ۽ مناسب احترام سان سنڀاليو وڃي ٿو.",
                "اسان جيڪا ڊيٽا گڏ ڪريون ٿا تنهن کي حساسيت، حفاظت ۽ پرائيويسي جي مناسب خيال سان سنڀاليو وڃي ٿو. پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) پنهنجي ڪلائنٽس کان گڏ ڪيل ڊيٽا کي ڪنهن به ٽئين ڌر آڏو ظاهر، ورهاست يا وڪرو نٿي ڪري."
              ]
            },
            "collection": {
              "title": "معلومات گڏ ڪرڻ",
              "lead_text": "PMA ممبرشپ سائن اپ لاءِ هيٺ ڏنل معلومات گڏ ڪري ٿي:",
              "items": [
                "ڪمپيوٽرائيزڊ قومي سڃاڻپ ڪارڊ (CNIC)",
                "مڪمل نالو",
                "رهائشي پتو",
                "آفس جو پتو",
                "فون نمبر",
                "اي ميل معلومات",
                "ميبرشپ بابت ٻي لاڳاپيل معلومات"
              ]
            }
          }
        },
        "complaint_policy": {
          "hero": {
            "title_main": "شڪايتون ۽ اپيل",
            "title_accent": "پاليسي",
            "lead_text": "اسان شڪايتن ۽ تحفظن کي منصفاڻي، فوري ۽ شفاف طريقي سان حل ڪرڻ لاءِ پرعزم آهيون."
          },
          "intro_card": {
            "bold_text": "اسان وٽ شڪايتن سان نمٽڻ لاءِ هڪ باقاعده طريقيڪار موجود آهي جيڪو اهو يقيني بڻائي ٿو ته انهن تي مناسب ڌيان ۽ سنڀال ڪئي وڃي.",
            "lead_p": "PMA جي ثالثي اڪريڊيٽيشن سروسز جو ڪو به واپرائيندڙ (صارف) شڪايت درج ڪرائي سگهي ٿو. PMA جو مقصد سڀني صارفين کي وقتائتيون ۽ ذميواراڻيون خدمتون فراهم ڪرڻ آهي. اسان:",
            "commitments": [
              "سڀني شڪايتن کي سنجيدگيءَ سان وٺنداسين ۽ انهن سان مناسب طريقي سان نمٽنداسين؛",
              "شڪايتن جو فوري ازالو ڪنداسين؛ ۽",
              "شڪايتن مان سکنداسين ۽ پنهنجي خدمتن کي بهتر بڻائڻ لاءِ قدم کڻنداسين."
            ]
          },
          "steps": [
            {
              "text": "تنهن هوندي، اسان صرف انهن شڪايتن تي ڪارروائي ڪري سگهون ٿا جيڪي ڊائريڪٽر آف ٽريننگ پاران مليل ناقص ڪسٽمر سروس بابت تحفظات پيدا ڪن ٿيون."
            },
            {
              "text": "ان جو مطلب اهو آهي ته توهان جو ڪيس ڊائريڪٽر آف ٽريننگ جي نالي هجڻ گهرجي ۽ ڊاڪ توڙي اي ميل ذريعي موڪليو وڃي، جنهن جي هڪ ڪاپي (cc) صدر PMA کي موڪلي وڃي."
            },
            {
              "text": "ڪو به شاگرد جيڪو ڊائريڪٽر آف ٽريننگ جي فيصلي مان مطمئن نه هجي، اهو فيصلي کي رد ڪرڻ لاءِ آزاد آهي، اهڙي صورت ۾ ان جو ڪو به لازمي اثر نه ٿيندو. ڊائريڪٽر شڪايت ملڻ جي 30 ڏينهن اندر جواب ڏيڻ جو پابند آهي."
            },
            {
              "text": "جيڪڏهن، تنهن هوندي، توهان پنهنجي شڪايت جي حل مان مطمئن نٿا ٿيو يا ڊائريڪٽر آف ٽريننگ پاران ڪو جواب نٿو ملي، ته توهان پنهنجي شڪايت صدر PMA کي موڪلي سگهو ٿا جيڪو توهان جي شڪايت جي ٻڌڻي لاءِ ٻن ميمبرن تي ٻڌل فيڪلٽي ٽريبونل قائم ڪندو."
            },
            {
              "text": "توهان کي پنهنجي درخواست جي سببن ۽ ڊائريڪٽر آف ٽريننگ جي جائزي يا عدم ڪارروائي مان توهان ڇا حاصل ڪرڻ چاهيو ٿا، ان بابت واضح ۽ مختصر ٿيڻو پوندو. ٻن ميمبرن وارو ٽريبونل صدر PMA کي ڪاپي سان گڏ توهان کي لکندو ۽ شڪايت وڌائڻ جي درخواست جي 30 ڪم وارن ڏينهن اندر توهان کي تحريري طور يقيني جواب ڏيندو."
            },
            {
              "text": "جيڪڏهن توهان پنهنجي شڪايت تي ٻن ميمبرن واري ٽريبونل جي ڪارروائي يا عدم ڪارروائي مان مطمئن ناهيو، ته ان سان ڪنهن به ڌر جي رليف لاءِ ڪنزيومر ڪورٽ (صارفين جي عدالت) سان رجوع ڪرڻ وارا حق متاثر نه ٿيندا، ۽ اهو اختيار سڀني لاءِ کليل آهي."
            }
          ]
        },
        "terms_conditions": {
          "hero": {
            "title_main": "شرطون ۽",
            "title_accent": "ضابطا",
            "lead_text": "برائي مهرباني انهن شرطن کي غور سان پڙهو. اسان جي ويب سائيٽ ۽ خدمتن تائين رسائي حاصل ڪرڻ ۽ استعمال ڪرڻ سان، توهان هيٺ ڏنل شرطن ۽ ضابطن جي تعميل ڪرڻ سان اتفاق ڪريو ٿا."
          },
          "accordion_items": [
            {
              "id": "training",
              "title": "ٽريننگ (تربيت)",
              "preview": "پنهنجي بڪنگ جي تصديق لاءِ، توهان جي ادائگي ڪورسز شروع ٿيڻ کان اڳ؛ اڳواٽ اسان جي آفيسن تائين پهچڻ گهرجي.",
              "body_paragraphs": [
                "جيڪڏهن واپرائيندڙ (صارف) ادائگي ۾ دير ڪندو، ته کيس ڪورسز ۾ ويهڻ جي اجازت نه ڏني ويندي."
              ]
            },
            {
              "id": "refunds",
              "title": "ٽريننگ ريفنڊز (رقم جي واپسي)",
              "preview": "اسان سمجهون ٿا ته زندگي پيچيده ٿي سگهي ٿي. جيڪڏهن توهان شرڪت ڪرڻ جي قابل ناهيو، ته برائي مهرباني جلد کان جلد اسان سان 9768-3452-021 تي رابطو ڪريو يا اسان کي info@pma.org.pk تي اي ميل ڪريو.",
              "body_paragraphs": [
                "اسان کي توهان جي جاءِ تي ڪنهن متبادل شرڪت ڪندڙ کي شامل ڪرڻ، يا ڪريڊٽ يا ريفنڊ جو بندوبست ڪرڻ ۾ خوشي ٿيندي ۽ اسان هميشه انفرادي بنيادن تي توهان جي ڪيس تي غور ڪنداسين."
              ]
            },
            {
              "id": "membership",
              "title": "ميمبرشپ جي منسوخي",
              "preview": "خاص حالتن کان علاوه ميمبرشپ فيس واپس نه ٿيڻ جوڳي (ناقابل واپسي) آهي.",
              "body_paragraphs": [
                "برائي مهرباني اسان سان رابطو ڪريو جيڪڏهن توهان سمجهو ٿا ته توهان جا حالات استثنيٰ جي معيار تي پورو لهن ٿا. هر ڪيس جو جائزو انفرادي طور تي PMA جي ميمبرشپ ڪميٽي وٺندي آهي."
              ]
            },
            {
              "id": "copyright",
              "title": "ڪاپي رائيٽ (جملي حق)",
              "preview": "هي سائيٽ ۽ ان جا مواد ڪاپي رائيٽ جي تابع آهن. سائيٽ جي مواد جي ڪاپي رائيٽ جي مالڪ پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) آهي، يا ڪجهه مواد جي صورت ۾، ڪا ٽئين ڌر آهي. سائيٽ جي ڪارڪردگي ۽ آپريشنل ڪاپي رائيٽ جي مالڪ پي ايم اي آهي.",
              "body_paragraphs": [
                "توهان پنهنجي ويب برائوزر کي استعمال ڪندي هن سائيٽ ۽ ان جي مواد کي ڏسي سگهو ٿا ۽ صرف ذاتي، غير تجارتي استعمال لاءِ هن سائيٽ جي حصن جي اليڪٽرانڪ ڪاپي ۽ هاريڊ ڪاپيون پرنٽ ڪري سگهو ٿا. هن سائيٽ جي مواد جو ڪو به ٻيو استعمال، بشمول ٻيهر تخليق، ترميم، ورهاست، منتقلي، ٻيهر اشاعت، نمائش يا ڪارڪردگي، سختي سان ممنوع آهي."
              ]
            },
            {
              "id": "disclaimer",
              "title": "دستبرداري (Disclaimer)",
              "preview": "توهان اتفاق ڪريو ٿا ته هن سائيٽ تائين توهان جي رسائي ۽ استعمال انهن شرطن ۽ سڀني لاڳو قانونن جي تابع آهي، ۽ اهو توهان جي پنهنجي خطرن تي آهي. هي سائيٽ ۽ ان جا مواد توهان کي \"جيئن آهي\" جي بنياد تي فراهم ڪيا ويا آهن، سائيٽ ۾ غلطيون، خاميون ۽ گھٽتائيون ٿي سگهن ٿيون ۽ ٿي سگهي ٿو ته اها مڪمل ۽ موجوده نه هجي.",
              "body_paragraphs": [
                "پاڪستان ميڊيائيٽرز ايسوسيئيشن (PMA) لاڳو قانونن تحت فراهم ڪيل سهولتن کان علاوه، هن سائيٽ جي آپريشن يا هن سائيٽ تي شامل معلومات، مواد يا شين جي حوالي سان ڪنهن به قسم جي صريح يا ضمني ضمانت يا نمائندگي نٿي ڪري.",
                "نه پي ايم اي ۽ نه ئي ان سان لاڳاپيل ادارا، ڊائريڪٽر، آفيسر، ملازم، ايجنٽ، ٺيڪيدار، جانشين يا تفويض ٿيل ماڻهو هن سائيٽ ۽ هن سائيٽ سان ڳنڍيل ڪنهن ٻي سائيٽ جي استعمال مان پيدا ٿيندڙ يا ڪنهن به طريقي سان لاڳاپيل نقصانن جا ذميوار هوندا. هي حد سڌي، بالواسطه، نتيجي طور، خاص، تعزيري يا ٻين نقصانن تي لاڳو ٿئي ٿي جيڪي توهان کي يا ٻين کي پهچي سگهن ٿا، گڏوگڏ منافعي جي نقصان، ڪاروبار ۾ رڪاوٽ يا ڊيٽا يا معلومات جي نقصان جي نقصانن تي پڻ لاڳو ٿئي ٿي."
              ]
            },
            {
              "id": "translations",
              "title": "گوگل تڪرار (Google Translations)",
              "preview": "هي ويب سائيٽ توهان جي سهولت لاءِ گوگل ٽرانسليٽ™ جي مدد سان ترجمو ڪئي وئي آهي. گوگل ٽرانسليٽ™ جا ترجمان هڪ خودڪار ڪمپيوٽرائيزڊ عمل جي ذريعي ڪيا ويندا آهن، ڪنهن تصديق ٿيل پيشيور مترجم جي ذريعي نه.",
              "body_paragraphs": [
                "ان ڪري، اهي ترجمو غلط يا ناقابل ڀروسو ٿي سگهن ٿا. گوگل ٽرانسليٽ™ جا ترجمو احتياط سان استعمال ڪريو. ترجمو ڪنهن به قسم جي وارنٽي کان سواءِ \"جيئن آهي\" جي بنياد تي مهيا ڪيا ويا آهن. ڪجهه مواد (جهڙوڪ تصويرون، وڊيوز، فليش وغيره) ترجمي جي سافٽ ويئر جي حدن جي ڪري ترجمو نه ٿي سگهندو آهي.",
                "پي ايم اي نامڪمل يا غلط ترجمي جي ذميوار ناهي، ۽ نه ئي هوءَ صارف پاران گوگل ٽرانسليٽ™ جي ترجمي (يا هن ويب سائيٽ تي موجود ڪنهن ٻئي ترجمي) جي استعمال مان پيدا ٿيندڙ ڪنهن نقصان يا زيان جي ذميوار آهي.",
                "جيڪڏهن توهان وٽ گوگل ٽرانسليٽ™ بابت ڪي سوال آهن، ته ڏسو: Google Translate™ FAQs.",
                "گوگل ترجمي سان لاڳاپيل سڀني وارنٽين کان دستبردار ٿئي ٿو، چاهي اهي صريح هجن يا ضمني، بشمول درستگي، قابل اعتماد هجڻ جي ڪا به وارنٽي، ۽ تجارتي قابليت، ڪنهن خاص مقصد لاءِ موزونيت ۽ ڀڃڪڙي نه ڪرڻ جي ڪا به ضمني وارنٽي."
              ]
            }
          ]
        },
        "become_member": {
          "hero": {
            "eyebrow": "PMA جوائن ڪريو",
            "title_main": "بڻجو هڪ",
            "title_accent": "PMA ميمبر",
            "lead_text": "ثالثن، ADR جي پيشيور ماهرن ۽ ادارتي اڳواڻن جي هڪ معزز برادري ۾ شامل ٿيو جيڪي پرامن طريقي سان تڪرارن جي حل لاءِ پرعزم آهن."
          },
          "why_join": {
            "title_main": "PMA ڇو",
            "title_accent": "جوائن",
            "title_end": "ڪجي؟",
            "subtitle": "PMA جا ميمبر پيشيورانه فائدن ۽ موقعن جي هڪ واضح سلسلي مان لطف اندوز ٿين ٿا.",
            "cards": [
              {
                "title": "بين الاقوامي ڪانفرنسون",
                "description": "رعايتي فيس ۽ ترجيحي رجسٽريشن سان ثالثي (mediation) ۽ پنچائيت (arbitration) جي جديد مسئلن تي عالمي ڪانفرنسن ۾ شرڪت ڪريو."
              },
              {
                "title": "ورڪشاپون ۽ ڪورسز",
                "description": "اعليٰ معيار جي تعليمي ورڪشاپن ۽ پيشيورانه ترقي جي ڪورسز تائين رسائي حاصل ڪريو."
              },
              {
                "title": "پيشيورانه واڌارو",
                "description": "ماهرن جي بصيرت ۽ وسيلن جي ذريعي ثالثي ۽ ADR جي باري ۾ پنهنجي سمجھ کي وڌايو."
              },
              {
                "title": "عالمي نيٽ ورڪ",
                "description": "قيمتي قومي ۽ بين الاقوامي پيشيورانه لاڳاپا قائم ڪريو ۽ انهن کي برقرار رکو."
              },
              {
                "title": "ڪاروباري موقعا",
                "description": "پنهنجي ڪاروباري ۽ پيشيورانه واقفڪارن جي دائري کي وسيع ڪريو."
              },
              {
                "title": "پيشي جي حمايت",
                "description": "ثالثي ۽ پرامن تڪرارن جي حل جي حمايت ۽ ترقي ۾ اهم ڪردار ادا ڪريو."
              }
            ]
          },
          "benefits": {
            "title_main": "ميمبرشپ جا",
            "title_accent": "فائدا",
            "subtitle": "PMA جي هڪ رجسٽرڊ ميمبر جي حيثيت ۾، توهان فائدن ۽ موقعن جي هڪ وسيع رينج مان لطف اندوز ٿيندؤ.",
            "items": [
              {
                "title": "نيٽ ورڪنگ جا موقعا",
                "description": "سڄو سال، PMA ميمبرن کي پيشيورانه لاڳاپا وڌائڻ ۽ انڊسٽري جي سرگرمين ۽ لاڙن کان باخبر رهڻ لاءِ مختلف موقعا فراهم ڪري ٿي."
              },
              {
                "title": "ميمبرشپ ڊائريڪٽري",
                "description": "خاص طور تي PMA ميمبرن لاءِ دستياب، هن ڊائريڪٽري ۾ ميمبرن ۽ ٻين عالمي تنظيمن جا اپڊيٽ ٿيل رابطي جا تفصيل موجود آهن. هي ڇپيل ۽ اليڪٽرانڪ ٻنهي صورتن ۾ دستياب آهي."
              },
              {
                "title": "ميمبرشپ سرٽيفڪيٽ",
                "description": "ميمبرن کي منظوري کان پوءِ عالمي سطح تي مڃيل ميمبرشپ سرٽيفڪيٽ جاري ڪيو ويندو آهي. سرٽيفڪيٽ سالياني ميمبرز گالا ۾ ڏنا ويندا آهن."
              },
              {
                "title": "مسلسل پيشيورانه ترقي",
                "description": "ثالثي ۽ ADR جي نامور ماهرن پاران انگريزي ۽ عربي ۾ ورتل خاص ورڪشاپن ۽ پيشيورانه ترقي جي ڪورسز تائين ترجيحي رسائي."
              }
            ]
          },
          "membership_journey": {
            "title": "ميمبرشپ جو سفر",
            "subtitle": "PMA جو هڪ معزز رڪن بڻجڻ جو هڪ سادو طريقو.",
            "steps": [
              {
                "num": "1",
                "title": "ميمبرشپ فارم جمع ڪرايو",
                "desc": "آن لائن درخواست فارم پُر ڪريو."
              },
              {
                "num": "2",
                "title": "پروفائل جو جائزو",
                "desc": "اسان جي ٽيم توهان جي درخواست جو جائزو وٺندي."
              },
              {
                "num": "3",
                "title": "ميمبرشپ جي منظوري",
                "desc": "توهان جي درخواست منظور ٿيڻ بعد توهان کي آگاهه ڪيو ويندو."
              },
              {
                "num": "4",
                "title": "PMA ۾ ڀليڪار",
                "desc": "پنهنجو ميمبرشپ سرٽيفڪيٽ حاصل ڪريو ۽ اسان جي پيشيور نيٽ ورڪ جو حصو بڻجو."
              }
            ]
          },
          "membership_application": {
            "form_header": {
              "title": "ميمبرشپ درخواست فارم",
              "desc": "برائي مھرباني درست معلومات فراهم ڪريو. اهي سڀ فيلڊز جن تي * جو نشان آهي لازمي آهن."
            },
            "sections": {
              "personal_info": {
                "title": "ذاتي معلومات",
                "fields": {
                  "full_name": { "label": "پورو نالو", "placeholder": "پنهنجو پورو نالو درج ڪريو" },
                  "father_name": { "label": "پيءُ جو نالو", "placeholder": "پيءُ جو نالو درج ڪريو" },
                  "qualification": { "label": "تعليمي قابليت", "placeholder": "تعليمي قابليت درج ڪريو" },
                  "designation": { "label": "عهدو", "placeholder": "عهدو درج ڪريو" },
                  "cnic": { "label": "سڃاڻپ ڪارڊ نمبر (CNIC)", "placeholder": "سڃاڻپ ڪارڊ نمبر درج ڪريو" },
                  "chamber_phone": { "label": "چيمبر فون", "placeholder": "چيمبر جو فون نمبر درج ڪريو" }
                }
              },
              "contact_info": {
                "title": "رابطي جي معلومات",
                "fields": {
                  "office_address": { "label": "دفتر جو پتو", "placeholder": "دفتر جو پتو درج ڪريو" },
                  "res_address": { "label": "رهاڪو پتو", "placeholder": "رهائشي پتو درج ڪريو" },
                  "res_phone": { "label": "گھر جو فون", "placeholder": "گھر جو فون نمبر درج ڪريو" },
                  "email": { "label": "اي ميل", "placeholder": "اي ميل ايڊريس درج ڪريو" },
                  "upload": {
                    "label": "دستاويز اپ لوڊ ڪريو",
                    "text": "فائل چونڊيو يا هتي ڇڪي اچو (Drag)",
                    "hint": "PDF, JPG, PNG (وڌ ۾ وڌ 5MB)"
                  }
                }
              },
              "references": {
                "title": "پيشيورانه حوالا (References)",
                "fields": {
                  "proposer_name": { "label": "تجويز ڪندڙ جو پورو نالو", "placeholder": "پروپوزر جو پورو نالو درج ڪريو" },
                  "proposer_address": { "label": "تجويز ڪندڙ جو رهاڪو پتو", "placeholder": "پتو درج ڪريو" },
                  "proposer_phone": { "label": "تجويز ڪندڙ جو فون", "placeholder": "فون نمبر درج ڪريو" },
                  "seconder_name": { "label": "تائيد ڪندڙ جو پورو نالو", "placeholder": "سيڪنڊر جو پورو نالو درج ڪريو" },
                  "seconder_address": { "label": "تائيد ڪندڙ جو رهاڪو پتو", "placeholder": "پتو درج ڪريو" },
                  "seconder_phone": { "label": "تائيد ڪندڙ جو فون", "placeholder": "فون نمبر درج ڪريو" }
                }
              }
            },
            "declaration": "مان اقرار ڪريان ٿو/ٿي ته مٿي ڏنل معلومات سچي ۽ درست آهي.",
            "submit_btn": "درخواست جمع ڪرايو",
            "sidebar": {
              "title_main": "مثبت تبديليءَ جو",
              "title_accent": "حصو بڻجو",
              "desc": "PMA ۾ شامل ٿيو ۽ ڳالهه ٻولهه، افهام و تفهيم ۽ پرامن تڪرارن جي حل جي ثقافت کي هٿي ڏيارڻ ۾ پنهنجو ڪردار ادا ڪريو.",
              "list": [
                "پيشيورانه سڃاڻپ",
                "سکن ۽ واڌارو",
                "نيٽ ورڪنگ ۽ تعاون",
                "اثرائتي ڀاڱيداري"
              ],
              "quote": "اسان گڏجي ثالثي جي ذريعي هڪ وڌيڪ هماهنگ ۽ انصاف واري سماج کي جوڙي سگهون ٿا.",
              "author": "- PMA"
            }
          }
        }
      }
    }
  };

  // Note: Profile modal data (member_1, trainer_*, etc.) is NOT cloned to non-English languages.
  // This ensures that when users switch to Urdu/Arabic/etc., the system falls back to the
  // English profile data from memberData instead of using misleading cloned English text in those language bundles.

  // Header selectors translation mapping (automatically translates header elements by URL)
  const headerTranslationMap = [
    { selector: '#mainmenu a[href="index.html"]', key: 'nav.home' },
    { selector: '#mainmenu a[href="about.html"]', key: 'nav.about' },
    { selector: '#mainmenu a[href="mediation.html"]', key: 'nav.mediation' },
    { selector: '#mainmenu a[href="services.html"]', key: 'nav.services' },
    { selector: '#mainmenu a[href="training.html"]', key: 'nav.training' },
    { selector: '#mainmenu a[href="leadership.html"]', key: 'nav.leadership' },
    { selector: '#mainmenu a[href="resources.html"]', key: 'nav.resources' },
    { selector: '#mainmenu a[href="events.html"]', key: 'nav.events' },
    { selector: '#mainmenu a[href="contact.html"]', key: 'nav.contact' },
    { selector: 'a[href="become-a-member.html"]', key: 'nav.membership' }
  ];

  // Helper to load i18next library dynamically from CDN
  function loadI18nextLibrary() {
    return new Promise((resolve, reject) => {
      if (window.i18next) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/i18next@23.11.5/dist/umd/i18next.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load i18next from CDN'));
      document.head.appendChild(script);
    });
  }

  // Fetch JSON files or return fallback resources on CORS / offline errors
  async function loadResources() {
    try {
      // Check if we are running in file:// protocol (which blocks local fetch in most browsers)
      if (window.location.protocol === 'file:') {
        console.warn('PMA Translator: Running on file:// protocol. Fetch is blocked by browser CORS policy. Using built-in fallback translations.');
        // Ensure profile modal resources (if any) are injected into the fallback bundle
        try {
          // Await injection so injectProfileModalResources can retry for memberData
          await injectProfileModalResources(fallbackResources);
        } catch (e) {
          // ignore
        }
        return fallbackResources;
      }

      // Fetch all supported language translation JSONs in parallel
      const fetches = await Promise.all(
        SUPPORTED_LANGS.map(lang =>
          fetch(`locals/${lang}/translation.json`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status} for lang: ${lang}`);
              return res.json();
            })
            .then(data => ({ lang, data }))
        )
      );

      // Build the i18next resources object — each JSON file has the lang code as root key
      const resources = {};
      fetches.forEach(({ lang, data }) => {
        // Support both { "en": { ... } } and bare { nav: {...}, ... } formats
        const translationData = data[lang] !== undefined ? data[lang] : data;
        resources[lang] = { translation: translationData };
      });

      return resources;
    } catch (err) {
      console.warn('PMA Translator: Could not load translation JSON files. Using built-in fallback translations. Error:', err.message);
      return fallbackResources;
    }
  }

  // Apply text direction and force layout/scrollbar recalculation to avoid ghost scrollbars
  function applyDirection(isRTL) {
    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
      // Disable scrollbar-gutter in RTL: the stable gutter would be reserved on
      // the inline-start (left) side, creating phantom horizontal scroll space.
      document.documentElement.style.scrollbarGutter = 'auto';
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
      // Restore stable gutter for LTR so the layout width doesn't shift on
      // pages where the vertical scrollbar appears/disappears.
      document.documentElement.style.scrollbarGutter = 'stable';
    }

    // Force a synchronous reflow so the browser recalculates all layout
    // dimensions immediately. Without this, stale cached heights from the
    // previous dir/gutter state cause phantom scroll space below the footer.
    void document.documentElement.offsetHeight;
  }

  // Force a complete layout recalculation: reset body height, trigger resize,
  // and scroll to top so that no stale cached dimensions persist.
  function forceLayoutRecalculation() {
    // 1. Temporarily clear any explicit/cached heights on body and html
    document.body.style.minHeight = '';
    document.body.style.height = '';
    document.documentElement.style.height = '';

    // 2. Force synchronous reflow
    void document.body.offsetHeight;

    // 3. Scroll to current position (preserves user position but forces
    //    the browser to recalculate scroll boundaries)
    window.scrollTo(window.scrollX, window.scrollY);

    // 4. Fire resize event so any JS that caches heights (e.g. WOW.js,
    //    sticky headers, parallax) will recalculate
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (e) {
      // IE11 fallback
      var evt = document.createEvent('Event');
      evt.initEvent('resize', true, true);
      window.dispatchEvent(evt);
    }
  }

  // Set document direction and stylesheet based on selected language
  function setLanguageLayout(lang) {
    // RTL languages: Arabic, Urdu, Pashto, Sindhi
    const RTL_LANGS = ['ar', 'ur', 'psh', 'sd'];
    const isRTL = RTL_LANGS.includes(lang);
    const bootstrapSheet = document.getElementById('bootstrap');

    if (bootstrapSheet) {
      const currentHref = bootstrapSheet.getAttribute('href') || '';
      const targetHref = isRTL ? 'css/bootstrap.rtl.min.css' : 'css/bootstrap.min.css';

      if (currentHref !== targetHref) {
        // Lock scrollbar gutter during stylesheet swap to prevent flash
        document.documentElement.classList.add('lang-switching');

        // Create a temporary link element to preload the stylesheet to avoid styling mismatch flashes
        const tempLink = document.createElement('link');
        tempLink.rel = 'stylesheet';
        tempLink.type = 'text/css';
        tempLink.href = targetHref;

        const finalize = function () {
          bootstrapSheet.setAttribute('href', targetHref);
          applyDirection(isRTL);
          tempLink.remove();
          // Release the scroll lock after the new layout has painted,
          // then force a full layout recalculation to eliminate phantom scroll
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.documentElement.classList.remove('lang-switching');
              forceLayoutRecalculation();
            });
          });
        };

        tempLink.onload = finalize;
        tempLink.onerror = finalize;

        document.head.appendChild(tempLink);
      } else {
        applyDirection(isRTL);
        forceLayoutRecalculation();
      }
    } else {
      applyDirection(isRTL);
      forceLayoutRecalculation();
    }
  }

  // Update dropdown UI styling and selection
  function updateLanguageDropdownUI(lang) {
    // Set active class on dropdown option
    document.querySelectorAll('.pma-lang-option').forEach(option => {
      const optionLang = option.getAttribute('data-lang');
      if (optionLang === lang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });

    // Update active label on the dropdown button
    const currentLangEl = document.querySelector('.pma-lang-current');
    if (currentLangEl) {
      const langLabels = {
        'en': 'English',
        'ur': 'اردو',
        'ar': 'العربية',
        'ch': '中文',
        'psh': 'پښتو',
        'sd': 'سنڌي'
      };
      currentLangEl.textContent = langLabels[lang] || 'English';
    }
  }


  // Helper: resolves translation keys with namespace-aware fallbacks.
  // Supports direct keys (e.g., "about-page.hero.eyebrow") and legacy flat keys.
  function translateKey(key, options) {
    if (!key) return '';

    // 1. Try directly (handles prefixed keys like "about-page.X" or "home-page.X")
    let res = window.i18next.t(key, options);
    if (res !== key && res !== undefined && res !== null) {
      return res;
    }

    // 2. Try with "home-page." prefix (legacy home page keys stored under namespace)
    const prefixedKey = 'home-page.' + key;
    let prefixedRes = window.i18next.t(prefixedKey, options);
    if (prefixedRes !== prefixedKey && prefixedRes !== undefined && prefixedRes !== null) {
      return prefixedRes;
    }

    // 3. Strip known prefixes and try flat lookup (graceful fallback)
    const prefixes = ['home-page.', 'about-page.'];
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        const flatKey = key.slice(prefix.length);
        let flatRes = window.i18next.t(flatKey, options);
        if (flatRes !== flatKey && flatRes !== undefined && flatRes !== null) {
          return flatRes;
        }
      }
    }

    return res;
  }

  // Apply translations to all DOM elements
  function translatePage() {
    // 1. Translate elements with data-i18n attributes (plain text)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translated = translateKey(key);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        // For form fields, update placeholder only
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', translated);
        }
      } else {
        // Plain text — safe for all keys that do not contain HTML markup
        el.textContent = translated;
      }
    });

    // 2. Translate elements with data-i18n-html attributes (innerHTML — allows accent spans)
    //    Used for heading keys that contain <span class="pma-about-heading-accent"> markup.
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = translateKey(key);
    });

    // 3. Translate footer list elements (data-i18n-list)
    //    Supports two list types:
    //    - "link"  → items are objects with { label, link }
    //    - "plain" → items are plain strings
    document.querySelectorAll('[data-i18n-list]').forEach(ul => {
      const key = ul.getAttribute('data-i18n-list');
      const listType = ul.getAttribute('data-i18n-list-type') || 'plain';
      if (!key) return;

      const items = translateKey(key, { returnObjects: true });
      if (!Array.isArray(items) || items.length === 0) return;

      // Determine icon class from existing first <li> (preserve icon style)
      let iconClass = '';
      const firstLi = ul.querySelector('li');
      if (firstLi) {
        const icon = firstLi.querySelector('i');
        if (icon) {
          iconClass = icon.className;
        }
      }

      // Re-render list items
      ul.innerHTML = items.map(item => {
        if (listType === 'link' && item && typeof item === 'object') {
          const label = item.label || '';
          const link = item.link || '#';
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li><a href="${link}">${iconHtml}${label}</a></li>`;
        } else if (listType === 'span' || listType === 'list-item') {
          const text = typeof item === 'string' ? item : String(item);
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li>${iconHtml}<span>${text}</span></li>`;
        } else {
          // plain string
          const text = typeof item === 'string' ? item : String(item);
          const iconHtml = iconClass
            ? `<i class="${iconClass}" aria-hidden="true"></i> `
            : '';
          return `<li>${iconHtml}${text}</li>`;
        }
      }).join('\n');
    });

    // 4. Translate attribute values (finds all data-i18n-attr-* attributes and sets the target attribute)
    // E.g., data-i18n-attr-alt="key" -> sets alt="translated"
    // E.g., data-i18n-attr-data-popup-quote="key" -> sets data-popup-quote="translated"
    const attrPrefix = 'data-i18n-attr-';
    document.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith(attrPrefix)) {
          const targetAttr = attr.name.slice(attrPrefix.length);
          const translationKey = attr.value;
          if (translationKey) {
            el.setAttribute(targetAttr, translateKey(translationKey));
          }
        }
      });
    });

    // 5. Translate header links using automated selector mapping (failsafe fallback)
    headerTranslationMap.forEach(({ selector, key }) => {
      document.querySelectorAll(selector).forEach(el => {
        // Only override text if it does not already have a translation attribute
        if (!el.hasAttribute('data-i18n') && !el.hasAttribute('data-i18n-html')) {
          el.textContent = translateKey(key);
        }
      });
    });
  }

  // Initialize translator
  async function initTranslator() {
    try {
      // 1. Hide unsupported options in dropdown (keep only English and Urdu)
      document.querySelectorAll('.pma-lang-option').forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (!SUPPORTED_LANGS.includes(lang)) {
          option.style.display = 'none';
        }
      });

      // 2. Load i18next script dynamically
      await loadI18nextLibrary();

      // 3. Load translation files
      const resources = await loadResources();
      await injectProfileModalResources(resources);

      // 4. Determine initial language (saved preference -> browser locale -> default to english)
      let savedLang = localStorage.getItem(STORAGE_KEY);
      if (!savedLang || !SUPPORTED_LANGS.includes(savedLang)) {
        const browserLang = (navigator.language || navigator.userLanguage || '').substring(0, 2);
        savedLang = SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
      }

      // 5. Initialize i18next library
      await window.i18next.init({
        lng: savedLang,
        fallbackLng: 'en',
        resources: resources,
        debug: false
      });

      // 6. Set initial direction & layout
      setLanguageLayout(savedLang);

      // 7. Update UI dropdown state
      updateLanguageDropdownUI(savedLang);

      // 8. Translate content
      translatePage();

      // 9. Bind click handlers to the language options
      document.querySelectorAll('.pma-lang-option').forEach(option => {
        option.addEventListener('click', async function (e) {
          e.preventDefault();
          const targetLang = this.getAttribute('data-lang');
          if (SUPPORTED_LANGS.includes(targetLang) && targetLang !== window.i18next.language) {
            // Change language in i18next
            await window.i18next.changeLanguage(targetLang);

            // Save preference
            localStorage.setItem(STORAGE_KEY, targetLang);

            // Update direction & stylesheet
            setLanguageLayout(targetLang);

            // Update dropdown active class & trigger label
            updateLanguageDropdownUI(targetLang);

            // Rerender translations
            translatePage();

            // Final safety: schedule another layout recalculation after
            // all DOM mutations and style recalcs from translation have settled.
            // This catches any edge cases where translated text changes element
            // heights and the previous recalc happened too early.
            setTimeout(function () {
              forceLayoutRecalculation();
            }, 350);
          }
        });
      });

    } catch (err) {
      console.error('PMA Language Translator Init Error:', err);
    }
  }

  // Execute initialization when DOM content is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslator);
  } else {
    initTranslator();
  }

})();
