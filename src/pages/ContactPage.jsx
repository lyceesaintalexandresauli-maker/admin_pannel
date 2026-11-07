import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import EditableWebsitePage from "../components/EditableWebsitePage";
import { api } from "../api/client";

export default function ContactPage() {
  const outlet = useOutletContext() || {};
  const [contactRows, setContactRows] = useState([]);

  useEffect(() => {
    let active = true;
    api.get("/contact")
      .then(({ data }) => { if (active && Array.isArray(data)) setContactRows(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const contact = useMemo(() => contactRows.reduce((result, row) => {
    result[String(row.type || "").toLowerCase()] = row.value;
    return result;
  }, {}), [contactRows]);

  const address = contact.address || outlet.settings?.location || "Muhura, Rwanda";
  const contactCopy = [
    `Email: ${outlet.settings?.primary_email || contact.email || "Contact the school for email details."}`,
    `Phone: ${outlet.settings?.primary_phone || contact.phone || "Contact the school for phone details."}`,
    `Address: ${String(address).replace(/<br\s*\/?\s*>/gi, "\n")}`,
  ].join("\n");

  return (
    <EditableWebsitePage
      page="contact"
      title="Contact Us"
      subtitle="Get in touch with the school"
      description="Contact Lycee Saint Alexandre Sauli de Muhura for admissions, programs, and general school information."
      appendSections={[{ section: "contact", title: "Contact Information", content: contactCopy }]}
    />
  );
}
