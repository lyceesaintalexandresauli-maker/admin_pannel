import { Link, useLocation } from "react-router-dom";

function mapHref(href) {
  if (!href) return "#";
  return href === "/index" ? "/" : href;
}

export default function NavTree({ items = [], onNavigate, depth = 0, includeMobileClose = false }) {
  const { pathname } = useLocation();
  const safeItems = Array.isArray(items)
    ? items.filter((item) => {
        const href = String(item?.href || "").replace(/\/+$/, "").toLowerCase();
        const label = String(item?.label || "").trim().toLowerCase();
        return href !== "/gallery" && label !== "gallery";
      })
    : [];
  if (depth > 6) return null;

  const toggleDropdown = (e, liElement) => {
    e.preventDefault();
    e.stopPropagation();
    liElement.classList.toggle('open');
  };

  const closeDropdown = (e, liElement) => {
    e.stopPropagation();
    liElement.classList.remove('open');
  };

  return (
    <ul className={depth === 0 ? "menu-links d-flex align-items-center" : ""}>
      {depth === 0 && includeMobileClose && (
        <li className="mobile-close d-xl-none" onClick={onNavigate}>
          <i className="bi bi-x"></i>
        </li>
      )}
      {safeItems.map((item) => {
        if (!item || typeof item !== "object") return null;
        const loginLabel = item.label?.trim().toLowerCase();
        const isResultsItem = depth === 0 && ["login", "student portal"].includes(loginLabel);
        const target = isResultsItem ? "/results" : mapHref(item.href);
        const active = pathname === target;
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        const displayLabel = isResultsItem ? "Student Results" : item.label;
        const label = String(item.label || "").trim().toLowerCase();
        const isDepartmentItem = depth === 0 && ["departments", "trades"].includes(label);
        const isContactItem = depth === 0 && label === "contact";
        const key = item.id ?? `${item.label ?? "item"}-${depth}-${target}`;
        return (
          <li
            key={key}
            className={`${hasChildren ? "dropdown" : ""} ${isResultsItem ? "d-xl-none" : ""} ${isDepartmentItem ? "nav-departments" : ""} ${isContactItem ? "nav-contact" : ""}`}
            ref={hasChildren ? (el) => {
              if (el) {
                const anchor = el.querySelector('a');
                if (anchor) {
                  anchor.onclick = (e) => toggleDropdown(e, el);
                }
                const dropdownUl = el.querySelector('ul');
                if (dropdownUl) {
                  dropdownUl.onclick = (e) => {
                    if (e.target === dropdownUl) {
                      closeDropdown(e, el);
                    }
                  };
                }
              }
            } : undefined}
          >
            {item.href ? (
              <Link
                to={target}
                className={active ? "active" : ""}
                onClick={onNavigate}
              >
                {displayLabel}
              </Link>
            ) : (
              <a href="#" onClick={(e) => e.preventDefault()}>
                <span>{displayLabel}</span> <i className="bi bi-chevron-down"></i>
              </a>
            )}
            {hasChildren && (
              <NavTree
                items={item.children}
                onNavigate={onNavigate}
                depth={depth + 1}
                includeMobileClose={false}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
