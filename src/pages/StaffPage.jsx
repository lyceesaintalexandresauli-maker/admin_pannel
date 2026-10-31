<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { mediaUrl } from "../api/client";
import { staffAPI, departmentsAPI } from "../api/services";
import "./StaffPage.css";

const sortStaffByIdAsc = (members = []) =>
  [...members].sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));

const formatWhatsAppNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("00250")) return digits.slice(2);
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  return digits;
};

const normalizeSearchValue = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const departmentOptionValue = (department) => String(department?.id ?? department?.name ?? "");
const DEPARTMENT_FIELD_NAMES = new Set([
  "trade",
  "trade_name",
  "subject",
  "subject_name",
  "program",
  "program_name",
  "specialization",
]);

const getStaffDepartmentValues = (member) =>
  Object.entries(member || {})
    .filter(([key]) => {
      const normalizedKey = key.toLocaleLowerCase();
      return normalizedKey.includes("department") || DEPARTMENT_FIELD_NAMES.has(normalizedKey);
    })
    .flatMap(([, value]) => {
      if (value && typeof value === "object") {
        return [value.id, value.name, value.title, value.code, value.department_id, value.department_name];
      }
      return [value];
    })
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== "");

const staffMatchesDepartment = (member, department) => {
  const departmentId = normalizeSearchValue(department?.id);
  const departmentNames = [department?.name, department?.title]
    .map(normalizeSearchValue)
    .filter(Boolean);
  const departmentCodes = [department?.code, department?.abbreviation]
    .map(normalizeSearchValue)
    .filter(Boolean);

  return getStaffDepartmentValues(member).some((value) => {
    const normalizedValue = normalizeSearchValue(value);
    if (normalizedValue === departmentId) return true;

    const matchesName = departmentNames.some((name) =>
      normalizedValue === name || normalizedValue.includes(name) ||
      (normalizedValue.length >= 5 && name.includes(normalizedValue))
    );
    const matchesCode = departmentCodes.some((code) =>
      normalizedValue === code || ` ${normalizedValue} `.includes(` ${code} `)
    );

    return matchesName || matchesCode;
  });
};

const findStaffDepartment = (member, departments) =>
  departments.find((department) => staffMatchesDepartment(member, department));

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [staffRes, deptsRes] = await Promise.all([
          staffAPI.getAll().catch(() => ({ data: [] })),
          departmentsAPI.getAll().catch(() => ({ data: [] })),
        ]);

        const sortedStaff = sortStaffByIdAsc(staffRes.data || []);
        setStaff(sortedStaff);
        setDepartments(deptsRes.data || []);
        setFilteredStaff(sortedStaff);
      } catch {
        setError("We could not load staff information right now.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...staff];

    if (filterDepartment !== "all") {
      const selectedDepartment = departments.find(
        (department) => departmentOptionValue(department) === filterDepartment
      );
      filtered = selectedDepartment
        ? filtered.filter((member) => staffMatchesDepartment(member, selectedDepartment))
        : filtered;
    }

    if (searchTerm) {
      const query = normalizeSearchValue(searchTerm);
      filtered = filtered.filter(
        (member) =>
          normalizeSearchValue(member.name).includes(query) ||
          normalizeSearchValue(member.position).includes(query) ||
          normalizeSearchValue(member.bio).includes(query)
      );
    }

    setFilteredStaff(sortStaffByIdAsc(filtered));
  }, [departments, filterDepartment, searchTerm, staff]);

  const handleStaffSearch = (value) => {
    setSearchTerm(value);
    const query = normalizeSearchValue(value);
    if (!query) return;

    const exactNameMatches = staff.filter((member) => normalizeSearchValue(member.name) === query);
    const nameMatches = exactNameMatches.length
      ? exactNameMatches
      : query.length >= 3
        ? staff.filter((member) => normalizeSearchValue(member.name).includes(query))
        : [];
    const matchedDepartments = new Map();
    nameMatches.forEach((member) => {
      const department = findStaffDepartment(member, departments);
      if (department) matchedDepartments.set(departmentOptionValue(department), department);
    });

    if (matchedDepartments.size === 1) {
      setFilterDepartment([...matchedDepartments.keys()][0]);
    } else if (matchedDepartments.size === 0 && nameMatches.length === 1) {
      setFilterDepartment("all");
    }
  };

  if (loading) {
    return (
      <main className="main">
        <Seo
          title="Our Staff"
          description="Meet the teaching staff, administrators, and support team at Lycee Saint Alexandre Sauli de Muhura."
          path="/trainers"
        />
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading staff...</span>
          </div>
          <p className="mt-3 text-muted">Loading staff...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main ui-page-shell">
      <Seo
        title="Our Staff"
        description="Meet the teaching staff, administrators, and support team at Lycee Saint Alexandre Sauli de Muhura."
        path="/trainers"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Staff</h1>
                <p>Meet our dedicated teachers, administrators, and support staff committed to student success.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mb-4 ui-staff-filter-shell" data-aos="fade-up">
        <div className="ui-staff-filter-controls" aria-label="Filter staff">
          <div className="ui-staff-filter-field">
            <label htmlFor="staff-search" className="ui-staff-filter-label"><i className="bi bi-search" aria-hidden="true"></i> Search staff</label>
          <div className={`input-group ui-staff-search-group${searchTerm ? " has-clear" : ""}`}>
            <span className="input-group-text ui-staff-search-icon">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              id="staff-search"
              className="form-control"
              list="staff-search-options"
              placeholder="Search by name, position, or bio..."
              aria-label="Search staff by name, position, or biography"
              value={searchTerm}
              onChange={(event) => handleStaffSearch(event.target.value)}
            />
            <datalist id="staff-search-options">
              {staff.map((member) => {
                const department = findStaffDepartment(member, departments);
                const suggestionLabel = [member.position, department?.name]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <option
                    key={member.id}
                    value={member.name || ""}
                    label={suggestionLabel}
                  />
                );
              })}
            </datalist>
            {searchTerm && (
              <button
                className="btn ui-staff-clear-search"
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear staff search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          </div>
          <div className="ui-staff-filter-field">
            <label htmlFor="staff-department" className="ui-staff-filter-label"><i className="bi bi-funnel-fill" aria-hidden="true"></i> Department</label>
          <div className="ui-staff-department-wrap">
            <select
              id="staff-department"
              className="form-select ui-staff-department-select"
              aria-label="Filter staff by department"
              value={filterDepartment}
              onChange={(event) => setFilterDepartment(event.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id ?? dept.name} value={departmentOptionValue(dept)}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          </div>
          <div className="ui-staff-filter-field ui-staff-filter-summary" aria-live="polite">
            <span><i className="bi bi-people-fill" aria-hidden="true"></i> Browse staff</span>
            <div className="ui-staff-filter-summary-value">
              {filteredStaff.length} {filteredStaff.length === 1 ? "staff member" : "staff members"} found
            </div>
          </div>
          <button
            className="btn ui-staff-clear-filters"
            type="button"
            onClick={() => {
              setFilterDepartment("all");
              setSearchTerm("");
            }}
          >
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Clear filters
          </button>
        </div>
      </div>

      <section className="container" data-aos="fade-up">
        {error && (
          <div className="alert alert-warning d-flex align-items-start" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
            <div className="flex-grow-1">
              <p className="mb-0">{error}</p>
            </div>
          </div>
        )}

        <div className="row g-4">
          {filteredStaff.length > 0 ? (
            filteredStaff.map((member, index) => (
              <div
                key={member.id}
                className="col-lg-4 col-md-6"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <article className="ui-staff-card">
                  <div className="ui-staff-cover">
                    {member.department && (
                      <span className="ui-staff-department">
                        <i className="bi bi-building" aria-hidden="true"></i>
                        {member.department}
                      </span>
                    )}
                  </div>

                  <div className="ui-staff-body">
                    <div className="ui-staff-avatar">
                      {member.image_path && (
                        <img
                          src={mediaUrl(member.image_path)}
                          alt={member.name}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <i className="bi bi-person-fill" aria-hidden="true"></i>
                    </div>

                    <h2 className="ui-staff-name">{member.name}</h2>
                    <p className="ui-staff-position">{member.position || "Staff Member"}</p>
                    <p className="ui-staff-bio">
                      {member.bio
                        ? `${member.bio.slice(0, 120)}${member.bio.length > 120 ? "..." : ""}`
                        : "No biography available."}
                    </p>

                    {member.phone && (
                      <a className="ui-staff-phone" href={`tel:${member.phone.replace(/[^\d+]/g, "")}`}>
                        <i className="bi bi-telephone" aria-hidden="true"></i>
                        <span>{member.phone}</span>
                      </a>
                    )}

                    <div className="ui-staff-footer">
                      <Link to={`/staff/${member.id}`} className="ui-staff-profile-link">
                        View Profile <i className="bi bi-arrow-right" aria-hidden="true"></i>
                      </Link>

                      <div className="ui-staff-socials" role="group" aria-label={`${member.name} contact links`}>
                        {member.email && (
                          <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`} title="Email">
                            <i className="bi bi-envelope" aria-hidden="true"></i>
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`https://wa.me/${formatWhatsAppNumber(member.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Chat with ${member.name} on WhatsApp`}
                            title="WhatsApp"
                          >
                            <i className="bi bi-whatsapp" aria-hidden="true"></i>
                          </a>
                        )}
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${member.name} on LinkedIn`}
                            title="LinkedIn"
                          >
                            <i className="bi bi-linkedin" aria-hidden="true"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-people text-muted" style={{ fontSize: "4rem" }}></i>
                </div>
                <h3 className="fw-bold text-muted mb-3">No Staff Found</h3>
                <p className="text-muted mb-4 px-4">
                  No staff members match your current filters. Try adjusting your search criteria or clear all filters.
                </p>
                {filterDepartment !== "all" && !searchTerm && (
                  <p className="text-muted small mb-4 px-4">
                    If staff should appear in this department, check that their staff profiles have the department assigned.
                  </p>
                )}
                <button
                  onClick={() => {
                    setFilterDepartment("all");
                    setSearchTerm("");
                  }}
                  className="btn text-white fw-semibold px-4"
                  style={{ backgroundColor: "var(--brand-accent)" }}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
=======
import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

export default function StaffPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/staff"
      title="Our Staff"
      subtitle="Meet our dedicated teaching and administrative staff"
      description="Meet the teachers, trainers, and staff of Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="Staff information will appear here soon."
      renderRecord={(member, { mediaUrl }) => (
        <article className="card h-100 border-0 shadow-sm">
          {member.image_path && <img className="card-img-top" src={mediaUrl(member.image_path)} alt={member.name || "School staff member"} loading="lazy" style={{ maxHeight: 280, objectFit: "cover" }} />}
          <div className="card-body p-4">
            <h2 className="h5 card-title mb-1">{member.name}</h2>
            <p className="text-primary mb-1">{member.position}</p>
            {member.department && <p className="small text-muted mb-2">{member.department}</p>}
            {member.bio && <p className="card-text text-muted" style={{ whiteSpace: "pre-wrap" }}>{member.bio}</p>}
            {member.email && <a href={`mailto:${member.email}`} className="d-block">{member.email}</a>}
            {member.phone && <a href={`tel:${member.phone}`} className="d-block">{member.phone}</a>}
          </div>
        </article>
      )}
    />
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  );
}
