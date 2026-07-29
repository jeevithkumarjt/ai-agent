(function () {
    "use strict";

    /* ---- Helpers ---- */
    const esc = (t) => { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; };

    const globeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
        <circle cx="12" cy="12" r="9"></circle>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <path d="M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z"></path>
    </svg>`;

    const briefcaseIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`;
    const clockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`;

    /* ---- State ---- */
    let allJobs = [];
    let currentView = "list";

    /* ---- DOM refs ---- */
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const container = $("#jobListings");
    const loadingState = $("#loadingState");
    const filterBar = $("#jobFilterBar");
    const locationSelect = $("#locationFilter");
    const teamSelect = $("#teamFilter");
    const searchInput = $("#searchInput");
    const clearSearch = $("#clearSearch");
    const resultsCount = $("#resultsCount");
    const activeFilters = $("#activeFilters");
    const statOpen = $("#statOpen");
    const statTeams = $("#statTeams");
    const statLocations = $("#statLocations");
    const viewBtns = $$(".view-btn");
    const toast = $("#toast");
    const modalOverlay = $("#applyModal");
    const modalClose = document.querySelector(".modal-close");
    const applyForm = $("#applyForm");
    const submitBtn = $("#submitButtonOfModel");
    const fileDrop = $("#fileDrop");
    const fileInput = $("#ResumeFile");

    /* ---- Toast ---- */
    let toastTimer;

    function showToast(message, type) {
        if (toastTimer) clearTimeout(toastTimer);
        toast.textContent = message;
        toast.className = "toast " + type + " show";
        toastTimer = setTimeout(() => { toast.classList.remove("show"); }, 4000);
    }

    /* ---- Normalize ---- */
    function normalizeJob(job) {
        job._category = job.JobCategory || job.Category || job.Department || job.Practice || job.JobType || "Other";
        job._location = job.Location || "Other";
        return job;
    }

    /* ---- Stats ---- */
    function updateStats(jobs) {
        const teams = new Set(jobs.map((j) => j._category).filter(Boolean));
        const locs = new Set(jobs.map((j) => j._location).filter(Boolean));
        animateNum(statOpen, jobs.length);
        animateNum(statTeams, teams.size);
        animateNum(statLocations, locs.size);
    }

    function animateNum(el, target) {
        const start = parseInt(el.textContent) || 0;
        if (start === target) return;
        const diff = target - start;
        const step = Math.max(1, Math.ceil(Math.abs(diff) / 25));
        let cur = start;
        const interval = setInterval(() => {
            cur += Math.sign(diff) * step;
            if ((diff > 0 && cur >= target) || (diff < 0 && cur <= target)) {
                cur = target;
                clearInterval(interval);
            }
            el.textContent = cur;
        }, 25);
    }

    /* ---- Filters ---- */
    function populateFilters(jobs) {
        const locs = [...new Set(jobs.map((j) => j._location).filter(Boolean))].sort();
        const teams = [...new Set(jobs.map((j) => j._category).filter(Boolean))].sort();

        locationSelect.innerHTML = '<option value="all">All locations</option>' +
            locs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
        teamSelect.innerHTML = '<option value="all">All teams</option>' +
            teams.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");

        filterBar.style.display = locs.length || teams.length ? "flex" : "none";
    }

    function getActiveChips() {
        const chips = [];
        if (locationSelect.value !== "all") chips.push({ type: "location", label: locationSelect.options[locationSelect.selectedIndex].text });
        if (teamSelect.value !== "all") chips.push({ type: "team", label: teamSelect.options[teamSelect.selectedIndex].text });
        return chips;
    }

    function renderChips() {
        const chips = getActiveChips();
        if (!chips.length) { activeFilters.innerHTML = ""; return; }
        activeFilters.innerHTML = chips.map((c) =>
            `<span class="filter-chip">${esc(c.label)} <button type="button" data-filter="${c.type}" aria-label="Remove filter">&times;</button></span>`
        ).join("");
    }

    /* ---- Format description with paragraphs and lists ---- */
    function formatDescription(text) {
        if (!text) return "";
        return text
            .split(/\n{2,}/)
            .map((block) => {
                block = block.trim();
                if (!block) return "";
                const lines = block.split("\n");
                const isList = lines.some((l) => /^[•\-*\d.]/.test(l.trim()));
                if (isList) {
                    return "<ul>" + lines.map((l) => {
                        const clean = l.replace(/^[•\-*\d.]+/, "").trim();
                        return clean ? `<li>${esc(clean)}</li>` : "";
                    }).join("") + "</ul>";
                }
                if (lines.length <= 2 && block.includes(":")) {
                    return `<p class="desc-label">${esc(block)}</p>`;
                }
                return "<p>" + esc(block) + "</p>";
            })
            .join("");
    }

    /* ---- Render ---- */
    function renderJobs(jobs) {
        if (!jobs.length) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
                            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </div>
                    <h3>No matching positions</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>`;
            resultsCount.textContent = "";
            return;
        }

        resultsCount.textContent = `Showing ${jobs.length} position${jobs.length !== 1 ? "s" : ""}`;

        const groups = {};
        jobs.forEach((j) => {
            if (!groups[j._category]) groups[j._category] = [];
            groups[j._category].push(j);
        });

        const frag = document.createDocumentFragment();

        Object.keys(groups).forEach((cat) => {
            const wrap = document.createElement("div");
            wrap.className = "job-category-group";

            const h = document.createElement("h3");
            h.className = "job-category-heading";
            h.textContent = cat;
            wrap.appendChild(h);

            groups[cat].forEach((job) => {
                const exp = job.TotalExp || job.Experience || "";
                const shift = job.Shift || job.ShiftTiming || job.WorkShift || "";
                const loc = job._location || "";
                const descHtml = formatDescription(job.Description);
                const did = "desc-" + (job.ReqIntID || Math.random().toString(36).slice(2));

                const div = document.createElement("div");
                div.className = "job-card";
                div.innerHTML = `
                    <div class="job-card-top">
                        <div class="job-card-head">
                            <h4 class="job-title">${esc(job.JobTitle || "")}</h4>
                            <span class="job-location-badge">${globeIcon} ${esc(loc)}</span>
                        </div>
                        <div class="job-meta-row">
                            ${exp ? `<span class="job-meta-tag">${briefcaseIcon} ${esc(exp)}</span>` : ""}
                            ${shift ? `<span class="job-meta-tag">${clockIcon} ${esc(shift)}</span>` : ""}
                        </div>
                    </div>
                    <div class="job-card-body">
                        <div class="job-description" id="${did}">
                            ${descHtml}
                        </div>
                        <button class="toggle-desc" data-target="${did}">
                            <span class="toggle-text-show">Show more</span>
                            <span class="toggle-text-hide" style="display:none">Show less</span>
                            <svg class="toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div class="job-card-footer">
                        <button type="button" class="apply-btn"
                            data-reqintid="${esc(job.ReqIntID || "")}"
                            data-jobtitle="${esc(job.JobTitle || "")}">Apply Now</button>
                    </div>`;
                wrap.appendChild(div);
            });

            frag.appendChild(wrap);
        });

        container.innerHTML = "";
        container.appendChild(frag);
        container.className = currentView === "grid" ? "grid-view" : "";
    }

    /* ---- Filter logic ---- */
    function applyFilters() {
        const loc = locationSelect.value;
        const team = teamSelect.value;
        const query = (searchInput.value || "").toLowerCase().trim();

        const filtered = allJobs.filter((job) => {
            const mLoc = loc === "all" || job._location === loc;
            const mTeam = team === "all" || job._category === team;
            const mSearch = !query ||
                (job.JobTitle && job.JobTitle.toLowerCase().includes(query)) ||
                (job.Description && job.Description.toLowerCase().includes(query)) ||
                (job._category && job._category.toLowerCase().includes(query)) ||
                (job._location && job._location.toLowerCase().includes(query));
            return mLoc && mTeam && mSearch;
        });

        renderJobs(filtered);
        renderChips();
        clearSearch.style.display = query ? "flex" : "none";
    }

    /* ---- View toggle ---- */
    viewBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            viewBtns.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            currentView = this.dataset.view;
            container.className = currentView === "grid" ? "grid-view" : "";
        });
    });

    /* ---- Event listeners ---- */
    locationSelect.addEventListener("change", applyFilters);
    teamSelect.addEventListener("change", applyFilters);
    searchInput.addEventListener("input", applyFilters);

    clearSearch.addEventListener("click", () => {
        searchInput.value = "";
        applyFilters();
        searchInput.focus();
    });

    activeFilters.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-filter]");
        if (!btn) return;
        if (btn.dataset.filter === "location") locationSelect.value = "all";
        if (btn.dataset.filter === "team") teamSelect.value = "all";
        applyFilters();
    });

    /* ---- Fetch data ---- */
    fetch("api/jobs.php")
        .then((r) => r.json())
        .then((result) => {
            if (result.success && result.data.length) {
                allJobs = result.data.map(normalizeJob);
                populateFilters(allJobs);
                updateStats(allJobs);
                applyFilters();
            } else {
                filterBar.style.display = "none";
                container.innerHTML = `
                    <div class="no-results">
                        <div class="no-results-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
                                <circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/>
                                <path d="M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z"/>
                            </svg>
                        </div>
                        <h3>No open positions right now</h3>
                        <p>Share your resume at <a href="mailto:hiring@sensiple.com" style="color:#6366f1;">hiring@sensiple.com</a></p>
                    </div>`;
                resultsCount.textContent = "";
            }
        })
        .catch(() => {
            filterBar.style.display = "none";
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
                            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h3>Unable to load jobs</h3>
                    <p>Please try again later.</p>
                </div>`;
            resultsCount.textContent = "";
        });

    /* ---- Modal open/close & toggle desc ---- */
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".apply-btn");
        if (btn) {
            const id = btn.dataset.reqintid;
            const title = btn.dataset.jobtitle;
            $("#modalJobId").value = id;
            $("#modalReqIntId").value = id;
            $("#modalJobTitle").value = title;
            $("#jobDesingation").textContent = title;
            modalOverlay.style.display = "block";
            document.body.style.overflow = "hidden";
        }

        const toggle = e.target.closest(".toggle-desc");
        if (toggle) {
            e.preventDefault();
            const desc = document.getElementById(toggle.dataset.target);
            if (!desc) return;
            desc.classList.toggle("expanded");
            const show = toggle.querySelector(".toggle-text-show");
            const hide = toggle.querySelector(".toggle-text-hide");
            const chevron = toggle.querySelector(".toggle-chevron");
            if (desc.classList.contains("expanded")) {
                if (show) show.style.display = "none";
                if (hide) hide.style.display = "inline";
                if (chevron) chevron.style.transform = "rotate(180deg)";
            } else {
                if (show) show.style.display = "inline";
                if (hide) hide.style.display = "none";
                if (chevron) chevron.style.transform = "rotate(0deg)";
            }
        }
    });

    function closeModal() {
        modalOverlay.style.display = "none";
        document.body.style.overflow = "";
    }

    modalClose?.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    /* ---- Inline validation ---- */
    const validateInputs = $$("#applyForm [data-validate]");
    validateInputs.forEach((inp) => {
        inp.addEventListener("blur", function () { validateField(this); });
        inp.addEventListener("input", function () { if (this.classList.contains("error")) validateField(this); });
    });

    function validateField(field) {
        const err = field.parentElement.querySelector(".field-error");
        if (!err) return true;
        const val = field.value.trim();
        let msg = "";

        if (!val) msg = "This field is required.";
        else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = "Enter a valid email.";
        else if (field.name === "MobileNumber" && val.length < 7) msg = "Enter a valid phone number.";

        if (msg) {
            field.classList.add("error");
            field.classList.remove("valid");
            err.textContent = msg;
            return false;
        }
        field.classList.remove("error");
        field.classList.add("valid");
        err.textContent = "";
        return true;
    }

    /* ---- File drop ---- */
    if (fileDrop && fileInput) {
        fileDrop.addEventListener("click", () => fileInput.click());

        fileDrop.addEventListener("dragover", (e) => { e.preventDefault(); fileDrop.classList.add("dragover"); });
        fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("dragover"));

        fileDrop.addEventListener("drop", (e) => {
            e.preventDefault();
            fileDrop.classList.remove("dragover");
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                onFileSelected(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files.length) onFileSelected(fileInput.files[0]);
        });
    }

    function onFileSelected(file) {
        const maxSize = 2 * 1024 * 1024;
        const validExts = ["pdf", "doc", "docx"];
        const ext = file.name.split(".").pop().toLowerCase();

        if (!validExts.includes(ext)) {
            showToast("Resume must be a PDF or DOC/DOCX file.", "error");
            fileInput.value = "";
            return;
        }

        if (file.size > maxSize) {
            showToast("Resume must be under 2 MB.", "error");
            fileInput.value = "";
            return;
        }

        fileDrop.classList.add("has-file");
        const text = fileDrop.querySelector(".file-drop-text");
        if (text) text.textContent = file.name;
        if (fileDrop.querySelector(".file-drop-hint")) fileDrop.querySelector(".file-drop-hint").textContent =
            (file.size / 1024).toFixed(1) + " KB";
    }

    /* ---- Form submit ---- */
    applyForm?.addEventListener("submit", function (e) {
        e.preventDefault();

        let valid = true;
        validateInputs.forEach((inp) => { if (!validateField(inp)) valid = false; });

        if (!fileInput?.files?.length) {
            showToast("Please upload your resume.", "error");
            const err = fileDrop?.parentElement?.querySelector(".field-error");
            if (err) err.textContent = "Resume is required.";
            valid = false;
        }

        if (!valid) return;

        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector(".btn-text");
        const btnLoader = submitBtn.querySelector(".btn-loader");
        if (btnText) btnText.style.display = "none";
        if (btnLoader) btnLoader.style.display = "inline-flex";

        const fd = new FormData(this);

        fetch("api/apply.php", { method: "POST", body: fd })
            .then((r) => r.json())
            .then((res) => {
                showToast(res.message, res.success ? "success" : "error");
                if (res.success) {
                    this.reset();
                    fileDrop.classList.remove("has-file");
                    const t = fileDrop?.querySelector(".file-drop-text");
                    if (t) t.textContent = "Drag & drop or browse";
                    const h = fileDrop?.querySelector(".file-drop-hint");
                    if (h) h.textContent = "PDF, DOC, DOCX \u2022 Max 2MB";
                    validateInputs.forEach((inp) => { inp.classList.remove("valid", "error"); });
                    const errs = $$("#applyForm .field-error");
                    errs.forEach((e) => e.textContent = "");
                    closeModal();
                }
            })
            .catch(() => {
                showToast("Network error. Please try again.", "error");
            })
            .finally(() => {
                submitBtn.disabled = false;
                if (btnText) btnText.style.display = "";
                if (btnLoader) btnLoader.style.display = "none";
            });
    });
})();
