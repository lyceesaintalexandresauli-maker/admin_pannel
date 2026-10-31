import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { contentAPI } from "../api/services";
import { getContentSections } from "../utils/helpers";

export default function NitPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contentAPI.getByPage('nit').catch(() => ({ data: { rows: [] } }));
        setContent(getContentSections(res.data));
      } catch (err) {
        console.error("Error fetching NIT content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (window.AOS) {
      window.AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }
  }, [loading]);

  const getSection = (slug) => content[slug] || {};

  const curriculumCards = [
    {
      section: 'networking_fundamentals',
      icon: 'bi-wifi',
      badge: 'Level 3',
      badgeColor: 'bg-emerald-500',
      fallbackTitle: 'Networking Fundamentals',
      fallbackContent: 'Learn about network types, topologies, protocols, and the OSI model.',
    },
    {
      section: 'lan_wan_technologies',
      icon: 'bi-hdd-network',
      badge: 'Level 4',
      badgeColor: 'bg-blue-500',
      fallbackTitle: 'LAN & WAN Technologies',
      fallbackContent: 'Study routers, switches, IP addressing, and wide area network configurations.',
    },
    {
      section: 'network_security',
      icon: 'bi-shield-lock',
      badge: 'Level 5',
      badgeColor: 'bg-amber-500',
      fallbackTitle: 'Network Security',
      fallbackContent: 'Firewalls, VPNs, encryption, and securing enterprise network infrastructure.',
    },
    {
      section: 'internet_technologies',
      icon: 'bi-cloud-arrow-up',
      badge: 'Level 4',
      badgeColor: 'bg-blue-500',
      fallbackTitle: 'Internet Technologies',
      fallbackContent: 'DNS, HTTP/HTTPS, cloud services, and modern internet infrastructure.',
    },
    {
      section: 'wireless_mobile_networks',
      icon: 'bi-diagram-3',
      badge: 'Level 5',
      badgeColor: 'bg-amber-500',
      fallbackTitle: 'Wireless & Mobile Networks',
      fallbackContent: 'Wi-Fi standards, cellular networks, IoT device connectivity and management.',
    },
    {
      section: 'capstone_project',
      icon: 'bi-terminal',
      badge: 'Level 3',
      badgeColor: 'bg-emerald-500',
      fallbackTitle: 'Capstone Project',
      fallbackContent: 'Design and configure a complete secure network infrastructure for a real-world scenario.',
    },
  ];

  const accordionLevels = [
    {
      section: 'level_3_networking_fundamentals',
      fallbackTitle: 'Level 3 - Networking Fundamentals',
      fallbackContent: 'Network types: LAN, MAN, WAN and their applications\nNetwork topologies: star, bus, ring, mesh\nOSI model and TCP/IP protocol suite\nBasic networking devices: hubs, switches, routers\nIP addressing, subnetting, and CIDR notation\nCapstone mini-project: Design a small office network',
      chronogram: '/assets/docs/level3_nesa_networking.pdf',
    },
    {
      section: 'level_4_lan_wan_internet_technologies',
      fallbackTitle: 'Level 4 - LAN, WAN & Internet Technologies',
      fallbackContent: 'Advanced switch and router configuration\nVLANs, trunking, and inter-VLAN routing\nStatic and dynamic routing protocols (OSPF, EIGRP)\nDNS, DHCP, and HTTP/HTTPS protocols\nCloud computing fundamentals and services\nInternet service provider technologies',
      chronogram: '/assets/docs/level4_nesa_networking.pdf',
    },
    {
      section: 'level_5_advanced_networking_security',
      fallbackTitle: 'Level 5 - Advanced Networking & Security',
      fallbackContent: 'Firewall types, configuration, and management\nVPN technologies: site-to-site and remote access\nEncryption protocols: SSL/TLS, IPsec\nWireless security: WPA3, 802.1X authentication\nIoT network integration and security challenges\nCapstone project: Enterprise secure network design',
      chronogram: '/assets/docs/level5_nesa_networking.pdf',
    },
  ];

  const cleanContent = (raw) => {
    if (!raw) return '';
    return raw.split(/View\/Download/)[0].trim();
  };

  const slideCarousel = (direction) => {
    if (!carouselRef.current) return;
    const step = Math.max(carouselRef.current.clientWidth * 0.8, 300);
    carouselRef.current.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (loading) return <div id="preloader"></div>;

  const aboutSection = getSection('about_networking_internet_technology_program');
  const aboutTitle = aboutSection.title || 'About Networking & Internet Technology Program';
  const aboutContent = cleanContent(aboutSection.content) || 'The Networking & Internet Technology program at Lycee de Muhura provides a progressive learning path through levels 3 to 5. Students develop expertise in network design, configuration, troubleshooting, and secure connectivity for modern enterprise environments.';

  return (
    <main className="main">
      <section className="hero-slider">
        <div className="slide active" style={{ backgroundImage: `url(${mediaUrl(getSection("hero_networking").image_path) || "/assets/img/photos/nit1.jpg"})` }}>
          <div className="slide-text">
            <h1>{aboutSection.title?.replace("About ", "") || "Networking & Internet Technology"}</h1>
            <p style={{ maxWidth: '900px', textAlign: 'center', lineHeight: '1.6', fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontWeight: '400' }}>{aboutContent || "Learn network design, configuration, troubleshooting and secure connectivity."}</p>
          </div>
        </div>
      </section>

      <section id="curriculum" className="curriculum container mt-5" data-aos="fade-up">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Curriculum Structure</h2>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => slideCarousel(-1)}
              className="btn btn-sm btn-outline-secondary rounded-circle"
              style={{ width: '36px', height: '36px' }}
              aria-label="Previous curriculum cards"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              onClick={() => slideCarousel(1)}
              className="btn btn-sm btn-outline-secondary rounded-circle"
              style={{ width: '36px', height: '36px' }}
              aria-label="Next curriculum cards"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        <div
          ref={carouselRef}
          className="d-flex gap-3 overflow-auto pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
            {curriculumCards.map((card, index) => {
              const section = getSection(card.section);
              const title = section.title || card.fallbackTitle;
              const rawContent = section.content || card.fallbackContent;
              const description = cleanContent(rawContent) || card.fallbackContent;

              return (
                <div
                  key={card.section}
                  className="flex-shrink-0"
                  style={{ width: '320px', scrollSnapAlign: 'start' }}
                  data-aos="zoom-in"
                  data-aos-delay={index * 50}
                >
                  <div className="card h-100 text-center p-3 shadow-sm">
                    <i className={`bi ${card.icon} fs-1 mb-3 text-primary`}></i>
                    <h5>{title}</h5>
                    <p>{description}</p>
                    <span className={`badge ${card.badgeColor}`}>{card.badge}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section id="levels" className="curriculum container mt-5" data-aos="fade-up">
        <h2 className="text-center mb-4">Curriculum Structure</h2>
        <div className="accordion" id="curriculumAccordion">
            {accordionLevels.map((level, index) => {
              const section = getSection(level.section);
              const title = section.title || level.fallbackTitle;
              const content = cleanContent(section.content) || level.fallbackContent;
              const chronogramUrl = level.chronogram;

              return (
                <div key={level.section} className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#level-${index}`}
                      aria-expanded="false"
                    >
                      {title}
                    </button>
                  </h2>
                  <div
                    id={`level-${index}`}
                    className="accordion-collapse collapse"
                    data-bs-parent="#curriculumAccordion"
                  >
                    <div className="accordion-body">
                      <ul>
                        {content.split("\n").filter(Boolean).map((line, i) => (
                          <li key={`${level.section}-${i}`}>{line.trim()}</li>
                        ))}
                      </ul>
                      <p>
                        <a href={mediaUrl(chronogramUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary mt-2">
                          View/Download NESA Chronogram
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="description container mt-5" data-aos="fade-up">
        <h2 className="text-center mb-3">{aboutTitle}</h2>
        <p>{aboutContent}</p>
        <div className="text-center mt-3">
          <Link to="/contact" className="btn btn-primary">Contact Admissions</Link>
          <Link to="/academic" className="btn btn-outline-primary ms-2">View All Programs</Link>
        </div>
      </section>

      <style>{`
        .hero-slider { position: relative; height: 60vh; overflow: hidden; }
        .slide { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .slide-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(92%, 960px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-align: center;
          padding: 1rem;
          z-index: 2;
        }
        .slide-text h1 { font-size: clamp(1.8rem, 4vw, 3rem); margin-bottom: .8rem; }
        .slide-text h4 { font-size: clamp(1rem, 2vw, 1.3rem); font-weight: 400; max-width: 760px; }
      `}</style>
      
      <section className="py-3"></section>
    </main>
  );
}
