import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/leads";

const EMPTY_LEAD = {
  name: "",
  email: "",
  phone: "",
  enquiry: "",
  dealValue: "",
  priority: "LOW",
  status: "NEW",
  source: "Website",
  lastResponseDate: "",
  nextFollowUpDate: "",
  possibleReason: ""
};

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "QUOTATION_SENT",
  "FOLLOW_UP_DONE",
  "CONVERTED",
  "LOST"
];

const SOURCE_OPTIONS = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Email",
  "Referral",
  "Phone"
];

const FEMALE_NAMES = [
  "priya",
  "rakshitha",
  "sneha",
  "pooja",
  "ananya",
  "divya",
  "swathi",
  "neha"
];

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
}

function formatDate(value) {
  if (!value) return "Not set";

  const d = new Date(`${value}T00:00:00`);

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function dateWithDay(value) {
  if (!value) return "Not scheduled";

  const d = new Date(`${value}T00:00:00`);

  return `${d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  })} – ${d.toLocaleDateString("en-IN", {
    weekday: "long"
  })}`;
}

function emojiFor(name = "") {
  const n = name.toLowerCase();
  return FEMALE_NAMES.some((x) => n.includes(x)) ? "👩" : "👨";
}

function daysBetween(date1, date2) {
  const a = new Date(date1);
  const b = new Date(date2);
  return Math.ceil((a - b) / 86400000);
}

function urgencyOf(lead) {
  if (!lead.nextFollowUpDate) {
    return { label: "Low", className: "low" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const follow = new Date(`${lead.nextFollowUpDate}T00:00:00`);
  const diff = daysBetween(follow, today);

  if (diff <= 0 || lead.priority === "HIGH") {
    return { label: "High", className: "high" };
  }

  if (diff <= 3 || lead.priority === "MEDIUM") {
    return { label: "Medium", className: "medium" };
  }

  return { label: "Low", className: "low" };
}

function riskScore(lead) {
  let score = 15;

  const value = Number(lead.dealValue || 0);

  if (value >= 100000) score += 25;
  else if (value >= 75000) score += 20;
  else if (value >= 50000) score += 12;

  if (lead.priority === "HIGH") score += 20;
  if (lead.priority === "MEDIUM") score += 10;

  if (lead.status === "QUOTATION_SENT") score += 15;
  if (lead.status === "CONTACTED") score += 8;
  if (lead.status === "LOST") score = 5;
  if (lead.status === "CONVERTED") score = 2;

  if (lead.lastResponseDate) {
    const today = new Date();
    const last = new Date(`${lead.lastResponseDate}T00:00:00`);
    const days = daysBetween(today, last);

    if (days >= 10) score += 20;
    else if (days >= 7) score += 15;
    else if (days >= 4) score += 10;
  }

  if (lead.nextFollowUpDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = new Date(`${lead.nextFollowUpDate}T00:00:00`);

    if (next <= today) score += 15;
    else if (daysBetween(next, today) <= 3) score += 7;
  }

  if (lead.possibleReason) score += 5;

  return Math.max(0, Math.min(100, score));
}

function riskLabel(score) {
  if (score <= 30) return ["Healthy", "healthy"];
  if (score <= 60) return ["At Risk", "risk"];
  if (score <= 80) return ["High Risk", "high"];
  return ["Critical", "critical"];
}

function aiAnalysis(lead) {
  const score = riskScore(lead);
  const reasons = [];

  if (lead.priority === "HIGH") {
    reasons.push("Lead is marked as high priority.");
  }

  if (Number(lead.dealValue || 0) >= 75000) {
    reasons.push("Potential deal value is significant.");
  }

  if (lead.status === "QUOTATION_SENT") {
    reasons.push("Quotation has already been shared.");
  }

  if (lead.lastResponseDate) {
    const today = new Date();
    const last = new Date(`${lead.lastResponseDate}T00:00:00`);
    const days = daysBetween(today, last);

    if (days >= 5) {
      reasons.push(`Customer has been inactive for ${days} days.`);
    }
  }

  if (lead.nextFollowUpDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const follow = new Date(`${lead.nextFollowUpDate}T00:00:00`);

    if (follow <= today) {
      reasons.push("Follow-up is due or overdue.");
    }
  }

  if (!reasons.length) {
    reasons.push("Lead requires regular engagement.");
  }

  let recommendation =
    "Contact the customer, understand the current requirement and schedule the next follow-up.";

  if (lead.status === "QUOTATION_SENT") {
    recommendation =
      "Follow up on the quotation, clarify value or pricing concerns and offer a quick discussion.";
  }

  if (lead.status === "NEW") {
    recommendation =
      "Contact the customer quickly, understand the requirement and move the lead to the next stage.";
  }

  if (lead.status === "FOLLOW_UP_DONE") {
    recommendation =
      "Review the latest customer response and schedule the next appropriate action.";
  }

  if (lead.status === "CONVERTED") {
    recommendation =
      "Thank the customer and move the opportunity into delivery or onboarding.";
  }

  if (lead.status === "LOST") {
    recommendation =
      "Review the loss reason and keep the customer available for a future re-engagement.";
  }

  return {
    score,
    reasons,
    recommendation,
    label: riskLabel(score)
  };
}

function generateMessage(lead, platform) {
  const name = lead.name || "there";
  const enquiry = lead.enquiry || "your requirement";
  const reason = lead.possibleReason || "your current requirement";

  if (platform === "WhatsApp") {
    return `Hi ${name} 👋

Just checking in regarding ${enquiry}.

I wanted to see if you had any questions or if there is anything you'd like us to clarify.

Would you like to have a quick discussion?`;
  }

  if (platform === "SMS") {
    return `Hi ${name}, just a quick reminder regarding ${enquiry}. Please let us know if you need any details. – OPTRA AI`;
  }

  return `Subject: Follow-up regarding ${enquiry}

Dear ${name},

I hope you are doing well.

I am following up regarding ${enquiry}. We wanted to check whether you had an opportunity to review the information shared.

We would be happy to clarify any questions or discuss your requirements further.

${reason ? `We can also discuss any concerns regarding ${reason}.` : ""}

Please let us know a convenient time for a quick discussion.

Regards,
OPTRA AI
Mysore`;
}

function App() {
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState("dashboard");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [detailsLead, setDetailsLead] = useState(null);
  const [aiLead, setAiLead] = useState(null);
  const [messageLead, setMessageLead] = useState(null);

  const [form, setForm] = useState(EMPTY_LEAD);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");

  const [messagePlatform, setMessagePlatform] =
    useState("WhatsApp");

  const [assistantQuery, setAssistantQuery] = useState("");

  const showMessage = (msg) => {
    setNotice(msg);

    clearTimeout(window.__optraToast);

    window.__optraToast = setTimeout(() => {
      setNotice("");
    }, 3200);
  };

  const loadLeads = async (refresh = false) => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();

      setLeads(Array.isArray(data) ? data : []);

      if (refresh) {
        showMessage("Leads refreshed successfully.");
      }
    } catch (error) {
      console.error(error);
      showMessage(
        "Backend connection failed. Start Spring Boot on port 8080."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const updateForm = (field, value) => {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showMessage("Please enter lead name.");
      return false;
    }

    if (!/^[A-Za-zÀ-ÿ\s.'-]{2,80}$/.test(form.name.trim())) {
      showMessage("Lead name should contain valid characters only.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      showMessage("Please enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      showMessage("Enter a valid 10-digit Indian phone number.");
      return false;
    }

    if (!form.enquiry.trim()) {
      showMessage("Please enter customer enquiry.");
      return false;
    }

    if (form.dealValue !== "" && Number(form.dealValue) < 0) {
      showMessage("Deal value cannot be negative.");
      return false;
    }

    return true;
  };

  const saveLead = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        enquiry: form.enquiry.trim(),
        dealValue: Number(form.dealValue || 0),
        lastResponseDate: form.lastResponseDate || null,
        nextFollowUpDate: form.nextFollowUpDate || null
      };

      const isEdit = Boolean(editingLead);

      const response = await fetch(
        isEdit ? `${API_URL}/${editingLead.id}` : API_URL,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setForm(EMPTY_LEAD);
      setEditingLead(null);
      setShowAdd(false);

      await loadLeads();

      setPage("leads");

      showMessage(
        isEdit
          ? "Lead updated successfully."
          : "Lead added successfully."
      );
    } catch (error) {
      console.error(error);
      showMessage(
        "Could not save lead. Check Spring Boot API."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm("Delete this lead permanently?")) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setLeads((old) =>
        old.filter((lead) => lead.id !== id)
      );

      setDetailsLead(null);

      showMessage("Lead deleted successfully.");
    } catch (error) {
      console.error(error);
      showMessage("Delete failed. Check DELETE API.");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingLead(null);
    setForm(EMPTY_LEAD);
    setShowAdd(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);

    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      enquiry: lead.enquiry || "",
      dealValue: lead.dealValue ?? "",
      priority: lead.priority || "LOW",
      status: lead.status || "NEW",
      source: lead.source || "Website",
      lastResponseDate: lead.lastResponseDate || "",
      nextFollowUpDate: lead.nextFollowUpDate || "",
      possibleReason: lead.possibleReason || ""
    });

    setDetailsLead(null);
    setShowAdd(true);
  };

  const filteredLeads = useMemo(() => {
    const key = search.toLowerCase().trim();

    const list = leads.filter((lead) => {
      const searchable = [
        lead.name,
        lead.email,
        lead.phone,
        lead.enquiry,
        lead.status,
        lead.priority,
        lead.source,
        lead.possibleReason
      ]
        .join(" ")
        .toLowerCase();

      const searchOK =
        !key || searchable.includes(key);

      const statusOK =
        statusFilter === "ALL" ||
        lead.status === statusFilter;

      const priorityOK =
        priorityFilter === "ALL" ||
        lead.priority === priorityFilter;

      const sourceOK =
        sourceFilter === "ALL" ||
        (lead.source || "Website") === sourceFilter;

      const urgency = urgencyOf(lead);

      const urgencyOK =
        urgencyFilter === "ALL" ||
        urgency.className === urgencyFilter;

      return (
        searchOK &&
        statusOK &&
        priorityOK &&
        sourceOK &&
        urgencyOK
      );
    });

    list.sort((a, b) => {
      if (sortBy === "dealValue") {
        return (
          Number(b.dealValue || 0) -
          Number(a.dealValue || 0)
        );
      }

      if (sortBy === "risk") {
        return riskScore(b) - riskScore(a);
      }

      if (sortBy === "followup") {
        return String(
          a.nextFollowUpDate || "9999"
        ).localeCompare(
          String(b.nextFollowUpDate || "9999")
        );
      }

      if (sortBy === "priority") {
        const order = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1
        };

        return (
          order[b.priority] -
          order[a.priority]
        );
      }

      return String(a[sortBy] || "")
        .toLowerCase()
        .localeCompare(
          String(b[sortBy] || "").toLowerCase()
        );
    });

    return list;
  }, [
    leads,
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
    urgencyFilter,
    sortBy
  ]);

  const totalLeads = leads.length;

  const highPriority = leads.filter(
    (l) => l.priority === "HIGH"
  ).length;

  const converted = leads.filter(
    (l) => l.status === "CONVERTED"
  ).length;

  const lost = leads.filter(
    (l) => l.status === "LOST"
  ).length;

  const totalDealValue = leads.reduce(
    (sum, l) =>
      sum + Number(l.dealValue || 0),
    0
  );

  const convertedRevenue = leads
    .filter((l) => l.status === "CONVERTED")
    .reduce(
      (sum, l) =>
        sum + Number(l.dealValue || 0),
      0
    );

  const overdue = leads.filter(
    (l) => urgencyOf(l).className === "high"
  );

  const dueSoon = leads.filter(
    (l) => urgencyOf(l).className === "medium"
  );

  const recovered = leads.filter(
    (l) =>
      l.status === "CONVERTED" ||
      l.status === "FOLLOW_UP_DONE"
  );

  const potentialAtRisk = leads
    .filter((l) => riskScore(l) >= 61)
    .reduce(
      (sum, l) =>
        sum + Number(l.dealValue || 0),
      0
    );

  const navigate = (value) => {
    setPage(value);
    setMobileMenu(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const navItems = [
    ["dashboard", "📊", "Dashboard"],
    ["leads", "👥", "Leads"],
    ["followups", "🔔", "Follow-ups"],
    ["ai", "🤖", "AI Analysis"],
    ["reports", "📈", "Reports"],
    ["messages", "💬", "AI Messages"]
  ];

  const riskLeads = [...leads]
    .sort((a, b) => riskScore(b) - riskScore(a))
    .slice(0, 5);

  return (
    <div className="app">
      <aside
        className={`sidebar ${
          mobileMenu ? "mobile-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">✦</div>

          <div>
            <b>OPTRA AI</b>
            <small>Lead Intelligence</small>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            ×
          </button>
        </div>

        <nav className="nav">
          {navItems.map(([id, icon, label]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="assistant-card">
          <span>✨</span>
          <b>OPTRA AI Assistant</b>
          <small>
            Ask about leads, risks and follow-ups.
          </small>

          <button
            onClick={() => setAssistantOpen(true)}
          >
            Open Assistant
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button
              className="hamburger"
              onClick={() =>
                setMobileMenu(true)
              }
            >
              ☰
            </button>

            <div>
              <b>
                {page === "dashboard"
                  ? "OPTRA AI Dashboard"
                  : page === "leads"
                  ? "Lead Management"
                  : page === "followups"
                  ? "Follow-up Center"
                  : page === "ai"
                  ? "AI Intelligence"
                  : page === "reports"
                  ? "Business Reports"
                  : "AI Message Studio"}
              </b>

              <small>
                Smart customer recovery • Mysore
              </small>
            </div>
          </div>

          <div className="top-actions">
            <button
              className="refresh-btn"
              onClick={() => loadLeads(true)}
              disabled={loading}
            >
              ↻ Refresh
            </button>

            <button
              className="primary-btn"
              onClick={openAdd}
            >
              ＋ Add Lead
            </button>
          </div>
        </header>

        <section className="main-content">
          {page === "dashboard" && (
            <Dashboard
              leads={leads}
              riskLeads={riskLeads}
              totalLeads={totalLeads}
              highPriority={highPriority}
              overdue={overdue}
              totalDealValue={totalDealValue}
              converted={converted}
              convertedRevenue={convertedRevenue}
              recovered={recovered}
              potentialAtRisk={potentialAtRisk}
              navigate={navigate}
              setDetailsLead={setDetailsLead}
              setAiLead={setAiLead}
            />
          )}

          {page === "leads" && (
            <LeadsPage
              leads={filteredLeads}
              total={totalLeads}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              urgencyFilter={urgencyFilter}
              setUrgencyFilter={setUrgencyFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              openAdd={openAdd}
              setDetailsLead={setDetailsLead}
              setAiLead={setAiLead}
              openEdit={openEdit}
              deleteLead={deleteLead}
            />
          )}

          {page === "followups" && (
            <FollowUps
              leads={leads}
              setDetailsLead={setDetailsLead}
              setAiLead={setAiLead}
              setMessageLead={setMessageLead}
            />
          )}

          {page === "ai" && (
            <AIAnalysisPage
              leads={leads}
              setDetailsLead={setDetailsLead}
              setAiLead={setAiLead}
              setMessageLead={setMessageLead}
            />
          )}

          {page === "reports" && (
            <Reports
              leads={leads}
              converted={converted}
              lost={lost}
              totalDealValue={totalDealValue}
              convertedRevenue={convertedRevenue}
              recovered={recovered}
            />
          )}

          {page === "messages" && (
            <MessagesPage
              leads={leads}
              messageLead={messageLead}
              setMessageLead={setMessageLead}
              platform={messagePlatform}
              setPlatform={setMessagePlatform}
            />
          )}
        </section>

        <Footer />
      </main>

      {showAdd && (
        <AddLeadModal
          form={form}
          updateForm={updateForm}
          saveLead={saveLead}
          close={() => {
            setShowAdd(false);
            setEditingLead(null);
            setForm(EMPTY_LEAD);
          }}
          editing={Boolean(editingLead)}
          loading={loading}
        />
      )}

      {detailsLead && (
        <DetailsModal
          lead={detailsLead}
          close={() => setDetailsLead(null)}
          edit={openEdit}
          remove={deleteLead}
          openAI={() => {
            setDetailsLead(null);
            setAiLead(detailsLead);
          }}
          openMessage={() => {
            setDetailsLead(null);
            setMessageLead(detailsLead);
            navigate("messages");
          }}
        />
      )}

      {aiLead && (
        <AIModal
          lead={aiLead}
          close={() => setAiLead(null)}
          openMessage={() => {
            setMessageLead(aiLead);
            setAiLead(null);
            navigate("messages");
          }}
        />
      )}

      {assistantOpen && (
        <Assistant
          leads={leads}
          query={assistantQuery}
          setQuery={setAssistantQuery}
          close={() => setAssistantOpen(false)}
          setDetailsLead={setDetailsLead}
          setAiLead={setAiLead}
        />
      )}

      {notice && (
        <div className="toast">
          <span>✓</span>
          {notice}
        </div>
      )}
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard({
  leads,
  riskLeads,
  totalLeads,
  highPriority,
  overdue,
  totalDealValue,
  converted,
  convertedRevenue,
  recovered,
  potentialAtRisk,
  navigate,
  setDetailsLead,
  setAiLead
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />

        <div className="hero-copy">
          <span className="eyebrow">
            ✦ INTELLIGENT LEAD RECOVERY PLATFORM
          </span>

          <h1>
            OPTRA AI
          </h1>

          <div className="moving-tagline">
            <span>
              Never lose a valuable customer because of a missed follow-up.
            </span>
          </div>

          <p>
            Identify risky leads, understand customer behaviour,
            prioritize follow-ups and generate personalized messages
            from one intelligent workspace.
          </p>
        </div>

        <div className="hero-badge">
          <div className="pulse-dot" />
          <b>AI Recovery Engine</b>
          <span>Active</span>
        </div>
      </section>

      <PosterSection />

      <section className="stats-grid">
        <Stat
          icon="👥"
          title="Total Leads"
          value={totalLeads}
          text="All customer enquiries"
          type="blue"
        />

        <Stat
          icon="🔥"
          title="High Priority"
          value={highPriority}
          text="Immediate attention"
          type="red"
        />

        <Stat
          icon="🔔"
          title="Follow-ups"
          value={overdue.length}
          text="Need action now"
          type="orange"
        />

        <Stat
          icon="💰"
          title="Pipeline Value"
          value={money(totalDealValue)}
          text="Potential opportunity"
          type="purple"
        />
      </section>

      <section className="dashboard-grid">
        <div className="content-card">
          <SectionHeading
            eyebrow="AI RECOVERY"
            title="Leads That Need Attention"
            text="Risk-based recommendations generated from your lead data."
          />

          <div className="risk-list">
            {riskLeads.length ? (
              riskLeads.map((lead) => {
                const ai = aiAnalysis(lead);

                return (
                  <div
                    className="risk-item"
                    key={lead.id}
                    onClick={() =>
                      setDetailsLead(lead)
                    }
                  >
                    <div className="risk-avatar">
                      {emojiFor(lead.name)}
                    </div>

                    <div className="risk-main">
                      <b>{lead.name}</b>
                      <span>
                        {lead.enquiry || "Customer enquiry"}
                      </span>
                    </div>

                    <div className="risk-score">
                      <strong>{ai.score}</strong>
                      <small>/100</small>
                      <span className={ai.label[1]}>
                        {ai.label[0]}
                      </span>
                    </div>

                    <button
                      className="mini-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAiLead(lead);
                      }}
                    >
                      AI Insight
                    </button>
                  </div>
                );
              })
            ) : (
              <Empty
                title="No leads yet"
                text="Add a customer lead to start recovery analysis."
              />
            )}
          </div>
        </div>

        <div className="content-card pipeline-card">
          <SectionHeading
            eyebrow="PIPELINE"
            title="Recovery Snapshot"
            text="Current business opportunity."
          />

          <div className="pipeline-number">
            {money(potentialAtRisk)}
            <span>value at high recovery risk</span>
          </div>

          <div className="progress-block">
            <div>
              <span>Converted</span>
              <b>{converted}</b>
            </div>
            <div className="progress">
              <i
                style={{
                  width: `${totalLeads
                    ? (converted / totalLeads) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>

          <div className="pipeline-stats">
            <div>
              <span>Recovered / Active</span>
              <b>{recovered.length}</b>
            </div>

            <div>
              <span>Revenue</span>
              <b>{money(convertedRevenue)}</b>
            </div>
          </div>

          <button
            className="primary-btn full-btn"
            onClick={() => navigate("followups")}
          >
            View Follow-ups →
          </button>
        </div>
      </section>

      <section className="content-card">
        <SectionHeading
          eyebrow="LEAD PIPELINE"
          title="Recent Customers"
          text="Quick access to your latest customer records."
          action={
            <button
              className="outline-btn"
              onClick={() => navigate("leads")}
            >
              View All Leads →
            </button>
          }
        />

        {leads.length ? (
          <LeadTable
            leads={leads.slice(0, 5)}
            setDetailsLead={setDetailsLead}
            setAiLead={setAiLead}
          />
        ) : (
          <Empty
            title="No customers available"
            text="Click Add Lead to create your first record."
          />
        )}
      </section>

      <section className="quick-grid">
        <QuickCard
          icon="🔔"
          title="Follow-up Center"
          text="See overdue and upcoming customer actions."
          onClick={() => navigate("followups")}
        />

        <QuickCard
          icon="🤖"
          title="AI Analysis"
          text="Understand why leads are at risk."
          onClick={() => navigate("ai")}
        />

        <QuickCard
          icon="💬"
          title="AI Message Studio"
          text="Generate WhatsApp, Email and SMS messages."
          onClick={() => navigate("messages")}
        />
      </section>
    </>
  );
}

/* =========================
   LEADS
========================= */

function LeadsPage({
  leads,
  total,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sourceFilter,
  setSourceFilter,
  urgencyFilter,
  setUrgencyFilter,
  sortBy,
  setSortBy,
  openAdd,
  setDetailsLead,
  setAiLead,
  openEdit,
  deleteLead
}) {
  return (
    <>
      <PageHero
        eyebrow="CUSTOMER MANAGEMENT"
        title="Leads"
        text="Manage every customer enquiry, opportunity and recovery action."
        action={
          <button
            className="primary-btn"
            onClick={openAdd}
          >
            ＋ Add New Lead
          </button>
        }
      />

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            🔎
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)}
              placeholder="Search name, email, phone, enquiry..."
            />
          </div>
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            {STATUS_OPTIONS.map((x) => (
              <option key={x} value={x}>
                {x.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) =>
              setSourceFilter(e.target.value)}
          >
            <option value="ALL">All Sources</option>
            {SOURCE_OPTIONS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) =>
              setUrgencyFilter(e.target.value)}
          >
            <option value="ALL">All Urgency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)}
          >
            <option value="name">Sort: Name</option>
            <option value="dealValue">
              Sort: Deal Value
            </option>
            <option value="priority">
              Sort: Priority
            </option>
            <option value="followup">
              Sort: Follow-up
            </option>
            <option value="risk">
              Sort: Risk Score
            </option>
            <option value="status">
              Sort: Status
            </option>
          </select>
        </div>

        <div className="result-row">
          Showing {leads.length} of {total} leads
        </div>

        {leads.length ? (
          <LeadTable
            leads={leads}
            setDetailsLead={setDetailsLead}
            setAiLead={setAiLead}
            openEdit={openEdit}
            deleteLead={deleteLead}
            showEdit
          />
        ) : (
          <Empty
            title="No matching leads"
            text="Try changing your search or filters."
          />
        )}
      </div>
    </>
  );
}

/* =========================
   FOLLOW UPS
========================= */

function FollowUps({
  leads,
  setDetailsLead,
  setAiLead,
  setMessageLead
}) {
  const high = leads.filter(
    (l) => urgencyOf(l).className === "high"
  );

  const medium = leads.filter(
    (l) => urgencyOf(l).className === "medium"
  );

  const low = leads.filter(
    (l) => urgencyOf(l).className === "low"
  );

  return (
    <>
      <PageHero
        eyebrow="RECOVERY WORKFLOW"
        title="Follow-ups"
        text="Know exactly who needs to be contacted and when."
      />

      <div className="follow-summary">
        <SummaryBox
          icon="🔴"
          title="High Urgency"
          value={high.length}
        />
        <SummaryBox
          icon="🟠"
          title="Medium Urgency"
          value={medium.length}
        />
        <SummaryBox
          icon="🟢"
          title="Low Urgency"
          value={low.length}
        />
      </div>

      <FollowSection
        title="High Urgency"
        icon="🔴"
        leads={high}
        setDetailsLead={setDetailsLead}
        setAiLead={setAiLead}
        setMessageLead={setMessageLead}
      />

      <FollowSection
        title="Medium Urgency"
        icon="🟠"
        leads={medium}
        setDetailsLead={setDetailsLead}
        setAiLead={setAiLead}
        setMessageLead={setMessageLead}
      />

      <FollowSection
        title="Upcoming"
        icon="🟢"
        leads={low}
        setDetailsLead={setDetailsLead}
        setAiLead={setAiLead}
        setMessageLead={setMessageLead}
      />
    </>
  );
}

function FollowSection({
  title,
  icon,
  leads,
  setDetailsLead,
  setAiLead,
  setMessageLead
}) {
  return (
    <section className="content-card">
      <SectionHeading
        eyebrow="ACTION QUEUE"
        title={`${icon} ${title}`}
        text={`${leads.length} lead(s) in this queue.`}
      />

      {leads.length ? (
        <div className="follow-list">
          {leads.map((lead) => {
            const urgency = urgencyOf(lead);

            return (
              <div className="follow-row" key={lead.id}>
                <div className="follow-avatar">
                  {emojiFor(lead.name)}
                </div>

                <div>
                  <b>{lead.name}</b>
                  <span>{lead.enquiry}</span>
                </div>

                <div>
                  <small>FOLLOW-UP</small>
                  <strong>
                    {dateWithDay(
                      lead.nextFollowUpDate
                    )}
                  </strong>
                </div>

                <div>
                  <small>DEAL</small>
                  <strong className="money">
                    {money(lead.dealValue)}
                  </strong>
                </div>

                <span
                  className={`urgency ${urgency.className}`}
                >
                  {urgency.label}
                </span>

                <div className="row-actions">
                  <button
                    onClick={() =>
                      setDetailsLead(lead)
                    }
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      setAiLead(lead)
                    }
                  >
                    AI
                  </button>

                  <button
                    onClick={() =>
                      setMessageLead(lead)
                    }
                  >
                    Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No leads in this queue"
          text="Your follow-up list is clear."
        />
      )}
    </section>
  );
}

/* =========================
   AI ANALYSIS
========================= */

function AIAnalysisPage({
  leads,
  setDetailsLead,
  setAiLead,
  setMessageLead
}) {
  const sorted = [...leads].sort(
    (a, b) => riskScore(b) - riskScore(a)
  );

  const critical = leads.filter(
    (l) => riskScore(l) >= 81
  ).length;

  const high = leads.filter(
    (l) => riskScore(l) >= 61
  ).length;

  const atRiskValue = leads
    .filter((l) => riskScore(l) >= 61)
    .reduce(
      (sum, l) =>
        sum + Number(l.dealValue || 0),
      0
    );

  return (
    <>
      <PageHero
        eyebrow="AI DECISION SUPPORT"
        title="AI Analysis"
        text="Understand lead risk, recovery reasons and the next best action."
      />

      <section className="ai-summary-grid">
        <AIStat
          icon="🔥"
          title="Critical Leads"
          value={critical}
          text="81–100 risk score"
        />

        <AIStat
          icon="⚠️"
          title="High Risk"
          value={high}
          text="61–80 risk score"
        />

        <AIStat
          icon="💰"
          title="Value at Risk"
          value={money(atRiskValue)}
          text="Recovery opportunity"
        />
      </section>

      <section className="content-card">
        <SectionHeading
          eyebrow="LEAD RISK ENGINE"
          title="Recovery Risk Scores"
          text="Score is calculated from response activity, follow-up status, deal value, priority and lead stage."
        />

        <div className="ai-lead-grid">
          {sorted.map((lead) => {
            const score = riskScore(lead);
            const label = riskLabel(score);

            return (
              <div className="ai-lead-card" key={lead.id}>
                <div className="ai-card-top">
                  <div className="risk-avatar large">
                    {emojiFor(lead.name)}
                  </div>

                  <div>
                    <h3>{lead.name}</h3>
                    <p>{lead.enquiry}</p>
                  </div>

                  <div className={`big-score ${label[1]}`}>
                    {score}
                    <small>/100</small>
                  </div>
                </div>

                <div className="score-bar">
                  <i
                    style={{
                      width: `${score}%`
                    }}
                  />
                </div>

                <div className="ai-label-row">
                  <span className={label[1]}>
                    {label[0]}
                  </span>

                  <b>{money(lead.dealValue)}</b>
                </div>

                <div className="ai-reasons">
                  {aiAnalysis(lead).reasons
                    .slice(0, 3)
                    .map((reason, i) => (
                      <p key={i}>
                        ✓ {reason}
                      </p>
                    ))}
                </div>

                <div className="ai-recommendation">
                  <small>AI RECOMMENDATION</small>
                  <p>
                    {aiAnalysis(lead).recommendation}
                  </p>
                </div>

                <div className="ai-buttons">
                  <button
                    onClick={() =>
                      setDetailsLead(lead)
                    }
                  >
                    Lead Details
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      setMessageLead(lead)
                    }
                  >
                    Generate Message
                  </button>

                  <button
                    className="outline-btn"
                    onClick={() =>
                      setAiLead(lead)
                    }
                  >
                    Full AI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* =========================
   REPORTS
========================= */

function Reports({
  leads,
  converted,
  lost,
  totalDealValue,
  convertedRevenue,
  recovered
}) {
  const statusData = STATUS_OPTIONS.map(
    (status) => ({
      status,
      count: leads.filter(
        (l) => l.status === status
      ).length
    })
  );

  const maxStatus = Math.max(
    ...statusData.map((x) => x.count),
    1
  );

  const reasonMap = {};

  leads.forEach((lead) => {
    const reason =
      lead.possibleReason ||
      "No reason recorded";

    reasonMap[reason] =
      (reasonMap[reason] || 0) + 1;
  });

  const reasons = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const recoveryRate = leads.length
    ? Math.round(
        (recovered.length / leads.length) *
          100
      )
    : 0;

  return (
    <>
      <PageHero
        eyebrow="BUSINESS INTELLIGENCE"
        title="Reports"
        text="Historical performance, conversion trends and recovery insights."
      />

      <div className="report-metrics">
        <ReportMetric
          title="Total Deal Value"
          value={money(totalDealValue)}
        />

        <ReportMetric
          title="Converted Revenue"
          value={money(convertedRevenue)}
        />

        <ReportMetric
          title="Recovery Rate"
          value={`${recoveryRate}%`}
        />

        <ReportMetric
          title="Lost Opportunities"
          value={lost}
        />
      </div>

      <section className="report-grid">
        <div className="content-card">
          <SectionHeading
            eyebrow="PIPELINE PERFORMANCE"
            title="Lead Status"
            text="Distribution of customer opportunities."
          />

          <div className="bar-chart">
            {statusData.map((item) => (
              <div
                className="bar-row"
                key={item.status}
              >
                <span>
                  {item.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>

                <div className="bar-track">
                  <i
                    style={{
                      width: `${
                        (item.count /
                          maxStatus) *
                        100
                      }%`
                    }}
                  />
                </div>

                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card">
          <SectionHeading
            eyebrow="RECOVERY REASONS"
            title="Why Leads Go Quiet"
            text="Reasons recorded in the lead recovery workflow."
          />

          <div className="reason-list">
            {reasons.length ? (
              reasons.map(([reason, count]) => (
                <div key={reason}>
                  <span>{reason}</span>
                  <b>{count}</b>
                </div>
              ))
            ) : (
              <Empty
                title="No reason data"
                text="Add possible reasons to leads."
              />
            )}
          </div>
        </div>
      </section>

      <section className="content-card">
        <SectionHeading
          eyebrow="RECOVERY PERFORMANCE"
          title="Recovery Funnel"
          text="How opportunities move through your recovery process."
        />

        <div className="funnel">
          <div>
            <span>All Leads</span>
            <b>{leads.length}</b>
          </div>

          <div>
            <span>Follow-up Done</span>
            <b>
              {
                leads.filter(
                  (l) =>
                    l.status ===
                    "FOLLOW_UP_DONE"
                ).length
              }
            </b>
          </div>

          <div>
            <span>Converted</span>
            <b>{converted}</b>
          </div>
        </div>
      </section>
    </>
  );
}

/* =========================
   AI MESSAGES
========================= */

function MessagesPage({
  leads,
  messageLead,
  setMessageLead,
  platform,
  setPlatform
}) {
  const lead =
    messageLead || leads[0];

  const message = lead
    ? generateMessage(lead, platform)
    : "";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(
        message
      );

      alert("Message copied successfully.");
    } catch {
      alert("Copy failed.");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="AI COMMUNICATION STUDIO"
        title="AI Messages"
        text="Generate personalized follow-up messages according to the customer's communication platform."
      />

      <section className="message-layout">
        <div className="content-card message-sidebar">
          <SectionHeading
            eyebrow="SELECT LEAD"
            title="Customers"
            text="Choose a customer to generate a message."
          />

          {leads.length ? (
            <div className="message-leads">
              {leads.map((item) => (
                <button
                  key={item.id}
                  className={
                    lead?.id === item.id
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setMessageLead(item)
                  }
                >
                  <span>
                    {emojiFor(item.name)}
                  </span>

                  <div>
                    <b>{item.name}</b>
                    <small>
                      {money(item.dealValue)}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="No leads"
              text="Add a lead first."
            />
          )}
        </div>

        <div className="content-card message-studio">
          {lead ? (
            <>
              <div className="message-lead-header">
                <div className="risk-avatar large">
                  {emojiFor(lead.name)}
                </div>

                <div>
                  <span>GENERATING FOR</span>
                  <h2>{lead.name}</h2>
                  <p>{lead.enquiry}</p>
                </div>

                <div className="message-risk">
                  Risk {riskScore(lead)}/100
                </div>
              </div>

              <div className="platform-tabs">
                {["WhatsApp", "Email", "SMS"].map(
                  (item) => (
                    <button
                      key={item}
                      className={
                        platform === item
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPlatform(item)
                      }
                    >
                      {item === "WhatsApp"
                        ? "💬"
                        : item === "Email"
                        ? "✉️"
                        : "📱"}{" "}
                      {item}
                    </button>
                  )
                )}
              </div>

              <div className="message-preview">
                <div className="message-preview-head">
                  <span>✨ OPTRA AI GENERATED</span>
                  <span>{platform}</span>
                </div>

                <pre>{message}</pre>
              </div>

              <div className="message-actions">
                <button
                  className="primary-btn"
                  onClick={copyMessage}
                >
                  📋 Copy Message
                </button>

                <button
                  className="outline-btn"
                  onClick={() =>
                    setMessageLead({
                      ...lead,
                      possibleReason:
                        lead.possibleReason ||
                        "Customer has not responded recently"
                    })
                  }
                >
                  ↻ Regenerate
                </button>
              </div>
            </>
          ) : (
            <Empty
              title="Select a lead"
              text="Choose a customer from the left."
            />
          )}
        </div>
      </section>
    </>
  );
}

/* =========================
   COMPONENTS
========================= */

function LeadTable({
  leads,
  setDetailsLead,
  setAiLead,
  openEdit,
  deleteLead,
  showEdit
}) {
  return (
    <div className="table-wrap">
      <div className="lead-table">
        {leads.map((lead) => {
          const risk = riskScore(lead);
          const riskInfo = riskLabel(risk);

          return (
            <div
              className="lead-table-row"
              key={lead.id}
              onClick={() =>
                setDetailsLead(lead)
              }
            >
              <div className="lead-person">
                <div className="person-emoji">
                  {emojiFor(lead.name)}
                </div>

                <div>
                  <h3>{lead.name}</h3>
                  <p>
                    {lead.email} · {lead.phone}
                  </p>
                </div>
              </div>

              <div>
                <small>ENQUIRY</small>
                <strong>
                  {lead.enquiry || "—"}
                </strong>
              </div>

              <div>
                <small>DEAL VALUE</small>
                <strong className="money">
                  {money(lead.dealValue)}
                </strong>
              </div>

              <div>
                <small>STATUS</small>
                <span className="pill blue">
                  {String(
                    lead.status || "NEW"
                  ).replaceAll("_", " ")}
                </span>
              </div>

              <div>
                <small>RISK</small>
                <span className={`risk-mini ${riskInfo[1]}`}>
                  {risk}
                </span>
              </div>

              <div
                className="table-actions"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <button
                  title="AI Analysis"
                  onClick={() =>
                    setAiLead(lead)
                  }
                >
                  ✨
                </button>

                {showEdit && (
                  <button
                    title="Edit"
                    onClick={() =>
                      openEdit(lead)
                    }
                  >
                    ✏️
                  </button>
                )}

                <button
                  title="Delete"
                  onClick={() =>
                    deleteLead(lead.id)
                  }
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddLeadModal({
  form,
  updateForm,
  saveLead,
  close,
  editing,
  loading
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal large-modal">
        <button
          className="modal-close"
          onClick={close}
        >
          ×
        </button>

        <div className="modal-title">
          <div className="modal-icon">＋</div>

          <div>
            <span>
              CUSTOMER INFORMATION
            </span>

            <h2>
              {editing
                ? "Edit Lead"
                : "Add New Lead"}
            </h2>

            <p>
              Enter complete customer information.
            </p>
          </div>
        </div>

        <form onSubmit={saveLead}>
          <div className="form-grid">
            <Field
              label="Lead Name"
              required
              value={form.name}
              onChange={(v) =>
                updateForm("name", v)
              }
              placeholder="e.g. Rahul"
            />

            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(v) =>
                updateForm("email", v)
              }
              placeholder="rahul@gmail.com"
            />

            <Field
              label="Phone"
              required
              type="tel"
              value={form.phone}
              onChange={(v) =>
                updateForm(
                  "phone",
                  v.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="9876543210"
            />

            <Field
              label="Enquiry"
              required
              value={form.enquiry}
              onChange={(v) =>
                updateForm("enquiry", v)
              }
              placeholder="Website Development"
            />

            <Field
              label="Deal Value (₹)"
              type="number"
              value={form.dealValue}
              onChange={(v) =>
                updateForm("dealValue", v)
              }
              placeholder="75000"
              min="0"
            />

            <SelectField
              label="Lead Source"
              value={form.source}
              onChange={(v) =>
                updateForm("source", v)
              }
              options={SOURCE_OPTIONS}
            />

            <SelectField
              label="Priority"
              value={form.priority}
              onChange={(v) =>
                updateForm("priority", v)
              }
              options={[
                "HIGH",
                "MEDIUM",
                "LOW"
              ]}
            />

            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) =>
                updateForm("status", v)
              }
              options={STATUS_OPTIONS}
            />

            <Field
              label="Last Response Date"
              type="date"
              value={form.lastResponseDate}
              onChange={(v) =>
                updateForm(
                  "lastResponseDate",
                  v
                )
              }
            />

            <Field
              label="Next Follow-up Date"
              type="date"
              value={form.nextFollowUpDate}
              onChange={(v) =>
                updateForm(
                  "nextFollowUpDate",
                  v
                )
              }
            />
          </div>

          {form.nextFollowUpDate && (
            <div className="date-preview">
              📅{" "}
              {dateWithDay(
                form.nextFollowUpDate
              )}
            </div>
          )}

          <label className="field full-field">
            <span>
              Possible Reason / Customer Concern
            </span>

            <textarea
              value={form.possibleReason}
              onChange={(e) =>
                updateForm(
                  "possibleReason",
                  e.target.value
                )
              }
              placeholder="Price concern, comparing competitors, no response..."
              rows="4"
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={close}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editing
                ? "Update Lead"
                : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  min
}) {
  return (
    <label className="field">
      <span>
        {label}{" "}
        {required && <b>*</b>}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        autoComplete="off"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      >
        {options.map((option) => (
          <option
            value={option}
            key={option}
          >
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailsModal({
  lead,
  close,
  edit,
  remove,
  openAI,
  openMessage
}) {
  const ai = aiAnalysis(lead);

  return (
    <div className="modal-backdrop">
      <div className="modal details-modal">
        <button
          className="modal-close"
          onClick={close}
        >
          ×
        </button>

        <div className="profile-header">
          <div className="person-emoji big">
            {emojiFor(lead.name)}
          </div>

          <div>
            <span>LEAD DETAILS</span>
            <h2>{lead.name}</h2>
            <p>{lead.enquiry}</p>
          </div>

          <div className={`detail-score ${ai.label[1]}`}>
            <strong>{ai.score}</strong>
            <span>Recovery Risk</span>
          </div>
        </div>

        <div className="detail-grid">
          <Detail
            label="Email"
            value={lead.email}
          />
          <Detail
            label="Phone"
            value={lead.phone}
          />
          <Detail
            label="Deal Value"
            value={money(lead.dealValue)}
          />
          <Detail
            label="Source"
            value={lead.source || "Website"}
          />
          <Detail
            label="Status"
            value={String(
              lead.status
            ).replaceAll("_", " ")}
          />
          <Detail
            label="Priority"
            value={lead.priority}
          />
          <Detail
            label="Last Response"
            value={formatDate(
              lead.lastResponseDate
            )}
          />
          <Detail
            label="Next Follow-up"
            value={dateWithDay(
              lead.nextFollowUpDate
            )}
          />
          <Detail
            label="Possible Reason"
            value={
              lead.possibleReason ||
              "Not recorded"
            }
          />
        </div>

        <div className="activity">
          <h3>Activity History</h3>

          <div>
            <span>✓</span>
            <p>
              Lead record created
              <small>
                Customer information added to OPTRA AI
              </small>
            </p>
          </div>

          <div>
            <span>✓</span>
            <p>
              Customer enquiry received
              <small>{lead.enquiry}</small>
            </p>
          </div>

          <div>
            <span>●</span>
            <p>
              Follow-up scheduled
              <small>
                {dateWithDay(
                  lead.nextFollowUpDate
                )}
              </small>
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="outline-btn"
            onClick={() => edit(lead)}
          >
            ✏️ Edit
          </button>

          <button
            className="outline-btn"
            onClick={openAI}
          >
            ✨ AI Analysis
          </button>

          <button
            className="primary-btn"
            onClick={openMessage}
          >
            💬 Generate Message
          </button>

          <button
            className="delete-btn"
            onClick={() => remove(lead.id)}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function AIModal({
  lead,
  close,
  openMessage
}) {
  const ai = aiAnalysis(lead);

  return (
    <div className="modal-backdrop">
      <div className="modal ai-modal">
        <button
          className="modal-close"
          onClick={close}
        >
          ×
        </button>

        <div className="ai-modal-header">
          <div className="ai-symbol">✦</div>

          <div>
            <span>OPTRA AI INTELLIGENCE</span>
            <h2>
              {lead.name} Recovery Analysis
            </h2>
            <p>
              {lead.enquiry}
            </p>
          </div>
        </div>

        <div className="risk-hero">
          <div>
            <small>RECOVERY RISK SCORE</small>
            <strong>{ai.score}/100</strong>
            <span className={ai.label[1]}>
              {ai.label[0]}
            </span>
          </div>

          <div className="score-ring">
            <span>{ai.score}</span>
          </div>
        </div>

        <div className="ai-modal-grid">
          <div>
            <small>WHY ATTENTION IS NEEDED</small>

            {ai.reasons.map(
              (reason, i) => (
                <p key={i}>
                  ⚠️ {reason}
                </p>
              )
            )}
          </div>

          <div>
            <small>RECOVERY RECOMMENDATION</small>

            <p className="recommendation">
              {ai.recommendation}
            </p>
          </div>
        </div>

        <div className="suggested-message">
          <div>
            <small>
              SUGGESTED FOLLOW-UP
            </small>

            <p>
              {generateMessage(
                lead,
                "WhatsApp"
              )}
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="outline-btn"
            onClick={close}
          >
            Close
          </button>

          <button
            className="primary-btn"
            onClick={openMessage}
          >
            💬 Open Message Studio
          </button>
        </div>
      </div>
    </div>
  );
}


function Assistant({
  leads,
  query,
  setQuery,
  close,
  setDetailsLead,
  setAiLead
}) {
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [messages, setMessages] = useState([]);

 

const getResponse = (input) => {
  const q = input.toLowerCase().trim();
  const allLeads = Array.isArray(leads) ? leads : [];

  if (!q) {
    return "Please enter a question about your leads.";
  }

  const normalizeStatus = (lead) =>
    String(lead.status || "UNKNOWN").toUpperCase().replace(/[\s-]+/g, "_");

  const activeLeads = allLeads.filter(
    lead => !["LOST", "CONVERTED"].includes(normalizeStatus(lead))
  );

  const lostLeads = allLeads.filter(
    lead => normalizeStatus(lead) === "LOST"
  );

  const convertedLeads = allLeads.filter(
    lead => normalizeStatus(lead) === "CONVERTED"
  );

  const newLeads = allLeads.filter(
    lead => normalizeStatus(lead) === "NEW"
  );

  const highPriorityLeads = allLeads.filter(
    lead => String(lead.priority || "").toUpperCase() === "HIGH"
  );

  const validDealLeads = allLeads.filter(
    lead =>
      lead.dealValue !== null &&
      lead.dealValue !== undefined &&
      lead.dealValue !== "" &&
      Number.isFinite(Number(lead.dealValue))
  );

  const totalPotentialRevenue = validDealLeads.reduce(
    (sum, lead) => sum + Number(lead.dealValue),
    0
  );

  const averageDealValue = validDealLeads.length
    ? totalPotentialRevenue / validDealLeads.length
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const eligibleForFollowUp = allLeads.filter(
    lead => !["LOST", "CONVERTED"].includes(normalizeStatus(lead))
  );

  const dueToday = eligibleForFollowUp.filter(
    lead => lead.nextFollowUpDate === todayString
  );

  const overdue = eligibleForFollowUp.filter(
    lead =>
      lead.nextFollowUpDate &&
      lead.nextFollowUpDate < todayString
  );

  const highestValueLead = [...validDealLeads].sort(
    (a, b) => Number(b.dealValue) - Number(a.dealValue)
  )[0];

  const rankedByRisk = [...activeLeads].sort(
    (a, b) => riskScore(b) - riskScore(a)
  );

  const highestRiskLeads = rankedByRisk.slice(0, 3);

  const listNames = list =>
    list.map(lead => lead.name || "Unnamed lead").join(", ");

  // 1. Greetings and general help
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(q)) {
    return "Hello! I'm OPTRA AI. You can ask me about lead counts, sales value, follow-ups, lead risks, recovery recommendations, or a specific lead by name.";
  }

  if (
    q.includes("what can you do") ||
    q.includes("help me") ||
    q === "help"
  ) {
    return "I can report total and active leads, summarize statuses, calculate potential revenue and average deal value, find due or overdue follow-ups, rank lead risks, and suggest recovery actions using your existing lead data.";
  }

  // 2. Total leads
  if (
    q.includes("total lead") ||
    q.includes("how many lead") ||
    q.includes("number of lead") ||
    q.includes("count of lead") ||
    q.includes("all leads")
  ) {
    return `You currently have ${allLeads.length} leads in the loaded dashboard data.`;
  }

  // 3. Lost and converted leads
  if (
    (q.includes("lost") || q.includes("converted") || q.includes("convert")) &&
    (q.includes("lead") || q.includes("how many") || q.includes("show"))
  ) {
    return `Lost leads: ${lostLeads.length}${
      lostLeads.length ? ` (${listNames(lostLeads)})` : ""
    }.\nConverted leads: ${convertedLeads.length}${
      convertedLeads.length ? ` (${listNames(convertedLeads)})` : ""
    }.`;
  }

  // 4. New leads
  if (
    q.includes("new lead") ||
    q.includes("recent lead") ||
    q.includes("lead just added")
  ) {
    return newLeads.length
      ? `You have ${newLeads.length} new lead(s): ${listNames(newLeads)}.`
      : "There are no leads currently marked NEW.";
  }

  // 5. Active leads
  if (
    q.includes("active lead") ||
    q.includes("open lead") ||
    q.includes("ongoing lead")
  ) {
    return `You have ${activeLeads.length} active lead(s)${
      activeLeads.length ? `: ${listNames(activeLeads)}` : ""
    }. Active means the status is neither LOST nor CONVERTED.`;
  }

  // 6. Leads by status
  if (
    q.includes("status") ||
    q.includes("pipeline") ||
    q.includes("breakdown") ||
    q.includes("group by")
  ) {
    const counts = allLeads.reduce((result, lead) => {
      const status = normalizeStatus(lead);
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});

    return "Lead status breakdown: " +
      Object.entries(counts)
        .map(([status, count]) => `${status}: ${count}`)
        .join("; ") +
      ".";
  }

  // 7. Total potential revenue
  if (
    q.includes("revenue") ||
    q.includes("deal value total") ||
    q.includes("total deal") ||
    q.includes("potential value") ||
    q.includes("pipeline value") ||
    q.includes("how much money") ||
    q.includes("total value")
  ) {
    return `Total potential deal value is ${money(totalPotentialRevenue)}, calculated from ${validDealLeads.length} lead(s) with a numeric deal value. This is potential pipeline value, not confirmed revenue.`;
  }

  // 8. Average deal value
  if (
    q.includes("average deal") ||
    q.includes("deal value average") ||
    q.includes("mean deal") ||
    q.includes("average value")
  ) {
    return averageDealValue === null
      ? "I can't calculate the average deal value because no leads have a numeric deal value."
      : `The average deal value is ${money(averageDealValue)}, based on ${validDealLeads.length} lead(s) with a numeric deal value.`;
  }

  // 9. Highest-value lead
  if (
    q.includes("highest value") ||
    q.includes("most valuable") ||
    q.includes("biggest deal") ||
    q.includes("largest deal") ||
    q.includes("highest deal")
  ) {
    return highestValueLead
      ? `${highestValueLead.name || "Unnamed lead"} has the highest deal value at ${money(Number(highestValueLead.dealValue))}.`
      : "No numeric deal values are available to compare.";
  }

  // 10. Follow-ups due today
  if (
    q.includes("due today") ||
    q.includes("follow up today") ||
    q.includes("follow-up today") ||
    q.includes("today's follow")
  ) {
    return dueToday.length
      ? `${dueToday.length} lead(s) have a follow-up scheduled for today: ${listNames(dueToday)}.`
      : "No active leads have a follow-up date scheduled for today.";
  }

  // 11. Overdue follow-ups
  if (
    q.includes("overdue") ||
    q.includes("missed follow") ||
    q.includes("past due")
  ) {
    return overdue.length
      ? `${overdue.length} active lead(s) have overdue follow-ups: ${
          overdue.map(lead =>
            `${lead.name || "Unnamed lead"} (scheduled ${lead.nextFollowUpDate})`
          ).join(", ")
        }.`
      : "No overdue follow-ups were found among active leads.";
  }

  // 12. General follow-up questions
  if (
    q.includes("follow-up") ||
    q.includes("follow up") ||
    q.includes("followup") ||
    q.includes("contact first") ||
    q.includes("who should i contact")
  ) {
    const urgent = [...eligibleForFollowUp].filter(
      lead => urgencyOf(lead).className === "high"
    );

    return urgent.length
      ? `These lead(s) are marked high urgency by the existing urgency rules: ${listNames(urgent)}. Check their follow-up dates and priority before contacting them.`
      : "No active leads are currently marked high urgency by the existing urgency rules.";
  }

  // 13. Highest-risk leads and leads needing attention
  if (
    q.includes("risk") ||
    q.includes("at risk") ||
    q.includes("at-risk") ||
    q.includes("attention") ||
    q.includes("danger") ||
    q.includes("recovery priority")
  ) {
    return highestRiskLeads.length
      ? "Highest-risk active leads by the existing rule-based score: " +
          highestRiskLeads.map(
            lead => `${lead.name || "Unnamed lead"} (${riskScore(lead)}/100)`
          ).join(", ") +
          ". These scores are calculated by your current app rules, not by a live AI model."
      : "There are no active leads to rank by risk.";
  }

  // 14. High-priority leads
  if (
    q.includes("high priority") ||
    q.includes("priority lead") ||
    q.includes("important lead")
  ) {
    return highPriorityLeads.length
      ? `You have ${highPriorityLeads.length} lead(s) marked HIGH priority: ${listNames(highPriorityLeads)}.`
      : "No leads are currently marked HIGH priority.";
  }

  // 15. Recovery recommendations
  if (
    q.includes("recover") ||
    q.includes("recovery") ||
    q.includes("save the lead") ||
    q.includes("improve conversion") ||
    q.includes("close more") ||
    q.includes("recommendation") ||
    q.includes("what should i do") ||
    q.includes("next action") ||
    q.includes("convert this lead")
  ) {
    const candidates = rankedByRisk.slice(0, 3);

    if (!candidates.length) {
      return "There are no active leads to prioritize for recovery.";
    }

    return "Suggested recovery priorities based on the current rule-based analysis:\n" +
      candidates.map(lead => {
        const analysis = aiAnalysis(lead);
        return `${lead.name || "Unnamed lead"} (risk ${riskScore(lead)}/100): ${
          analysis.recommendation || "Review the lead record and decide on a suitable follow-up."
        }`;
      }).join("\n");
  }

  // 16. Search for a specific lead by name
  // Match full names from the loaded lead list, rather than guessing.
  const matchedLead = [...allLeads]
    .filter(lead => lead.name && lead.name.trim().length > 0)
    .sort((a, b) => b.name.trim().length - a.name.trim().length)
    .find(lead => {
      const name = lead.name.toLowerCase().trim();
      return q.includes(name);
    });

  if (matchedLead) {
    const analysis = aiAnalysis(matchedLead);
    const value =
      matchedLead.dealValue !== null &&
      matchedLead.dealValue !== undefined &&
      matchedLead.dealValue !== "" &&
      Number.isFinite(Number(matchedLead.dealValue))
        ? money(Number(matchedLead.dealValue))
        : "Not available";

    const detailParts = [
      `Lead: ${matchedLead.name}`,
      `Status: ${matchedLead.status || "Not available"}`,
      `Priority: ${matchedLead.priority || "Not available"}`,
      `Enquiry: ${matchedLead.enquiry || "Not available"}`,
      `Deal value: ${value}`,
      `Last response date: ${matchedLead.lastResponseDate || "Not recorded"}`,
      `Next follow-up date: ${matchedLead.nextFollowUpDate || "Not scheduled"}`,
      `Possible reason: ${matchedLead.possibleReason || "Not recorded"}`,
      `Rule-based risk score: ${riskScore(matchedLead)}/100`,
      `Recommended action: ${
        analysis.recommendation || "Review the lead and choose an appropriate follow-up."
      }`
    ];

    return detailParts.join("\n");
  }

  // 17. No match: be transparent instead of inventing an answer
  return "I couldn't match that question to a supported report yet. Try asking about total leads, active leads, status breakdown, potential revenue, average deal value, highest-value lead, today's follow-ups, overdue follow-ups, lead risk, recovery recommendations, or a lead's exact name.";
};

  const sendMessage = () => {
    const text = query.trim();

    if (!text) return;

    const reply = getResponse(text);

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), question: text, answer: reply }
    ]);

    setSubmittedQuery(text);
    setQuery("");
  };

  return (
    <div className="assistant-overlay">
      <div className="assistant-panel">
        <button className="modal-close" onClick={close}>
          ×
        </button>

        <div className="assistant-header">
          <div className="assistant-avatar">✦</div>
          <div>
            <span>OPTRA AI</span>
            <h2>AI Assistant</h2>
            <p>Your lead recovery copilot</p>
          </div>
        </div>

        <div className="assistant-chat">
          <div className="bot-message">
            👋 Hi! I can analyze your leads.
            <br />
            <b>Try asking: “Which leads need attention?”</b>
          </div>

          {messages.map((message) => (
            <div key={message.id}>
              <div className="user-message">
                {message.question}
              </div>
              <div className="bot-message">
                {message.answer}
              </div>
            </div>
          ))}
        </div>

        <div className="assistant-suggestions">
          {[
            "Which leads need attention?",
            "Show follow-ups",
            "What is my revenue?",
            "Which leads are high risk?"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setQuery(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          className="assistant-input"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Escape"
              ) {
                setQuery("");
              }
            }}
            placeholder="Ask OPTRA AI..."
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={!query.trim()}
          >
            Ask
          </button>
        </form>

        <div className="assistant-actions">
          <button
            onClick={() => {
              const lead = [...leads].sort(
                (a, b) => riskScore(b) - riskScore(a)
              )[0];

              if (lead) {
                close();
                setAiLead(lead);
              }
            }}
          >
            ✨ Open Highest Risk
          </button>

          <button
            onClick={() => {
              const lead = leads.find(
                (l) => urgencyOf(l).className === "high"
              );

              if (lead) {
                close();
                setDetailsLead(lead);
              }
            }}
          >
            🔔 View Urgent Lead
          </button>
        </div>
      </div>
    </div>
  );
}

function PosterSection() {
  const posters = [
    [
      "🎯",
      "RECOVER MORE LEADS",
      "Turn missed replies into new opportunities."
    ],
    [
      "⚡",
      "SMART FOLLOW-UPS",
      "Know who needs attention today."
    ],
    [
      "🤖",
      "AI RECOVERY INSIGHTS",
      "Understand the next best action."
    ],
    [
      "💬",
      "PERSONALIZED MESSAGES",
      "Generate WhatsApp, Email and SMS content."
    ],
    [
      "📈",
      "GROW YOUR PIPELINE",
      "Protect valuable customer opportunities."
    ]
  ];

  return (
    <section className="poster-wrapper">
      <div className="poster-track">
        {[...posters, ...posters].map(
          (poster, index) => (
            <div
              className={`poster poster-${index % 5}`}
              key={index}
            >
              <span>{poster[0]}</span>

              <div>
                <b>{poster[1]}</b>
                <p>{poster[2]}</p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function Stat({
  icon,
  title,
  value,
  text,
  type
}) {
  return (
    <div className={`stat-card ${type}`}>
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <small>{title}</small>
        <strong>{value}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function AIStat({
  icon,
  title,
  value,
  text
}) {
  return (
    <div className="ai-stat">
      <span>{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function ReportMetric({ title, value }) {
  return (
    <div className="report-metric">
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryBox({
  icon,
  title,
  value
}) {
  return (
    <div className="summary-box">
      <span>{icon}</span>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  text,
  onClick
}) {
  return (
    <button
      className="quick-card"
      onClick={onClick}
    >
      <span>{icon}</span>
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <strong>→</strong>
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  action
}) {
  return (
    <div className="section-head">
      <div>
        <span className="section-eyebrow">
          {eyebrow}
        </span>

        <h2>{title}</h2>

        {text && <p>{text}</p>}
      </div>

      {action}
    </div>
  );
}

function PageHero({
  eyebrow,
  title,
  text,
  action
}) {
  return (
    <section className="page-hero">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>

      {action}
    </section>
  );
}

function Empty({ title, text }) {
  return (
    <div className="empty">
      <div>◎</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <div className="footer-logo">✦</div>

        <h3>OPTRA AI</h3>

        <p>
          Intelligent lead recovery and customer
          engagement platform.
        </p>

        <span>📍 Mysore, Karnataka</span>
      </div>

      <div>
        <h4>CORE DIVISIONS</h4>
        <p>Website Development</p>
        <p>E-commerce Solutions</p>
        <p>AI & Automation</p>
        <p>WhatsApp Solutions</p>
        <p>Digital Marketing</p>
      </div>

      <div>
        <h4>CAPABILITIES</h4>
        <p>Business Websites</p>
        <p>Shopify Development</p>
        <p>AI Chatbots & Voice</p>
        <p>WhatsApp API</p>
        <p>Google AI</p>
      </div>

      <div>
        <h4>INDUSTRIES</h4>
        <p>Real Estate</p>
        <p>E-commerce Brands</p>
        <p>SaaS & Software</p>
        <p>Healthcare & Clinics</p>
        <p>Agencies & Startups</p>
      </div>

      <div>
        <h4>COMPANY</h4>
        <p>About OPTRA AI</p>
        <p>Work & Portfolio</p>
        <p>Case Studies</p>
        <p>Blog & Guides</p>
        <p>Privacy Policy</p>
      </div>

      <div className="footer-bottom">
        © 2026 OPTRA AI • Intelligent Lead Recovery Platform • Mysore
      </div>
    </footer>
  );
}

export default App;