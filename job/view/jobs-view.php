<div class="jobs-header">
    <div class="jobs-header-top">
        <h2>Open Positions</h2>
        <div class="view-toggle">
            <button type="button" class="view-btn active" data-view="list" title="List view">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
            </button>
            <button type="button" class="view-btn" data-view="grid" title="Grid view">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="jobs-controls">
        <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" id="searchInput" class="search-input" placeholder="Search by title, skill, or keyword&hellip;" autocomplete="off">
            <button type="button" id="clearSearch" class="clear-search" style="display:none">&times;</button>
        </div>
        <div id="jobFilterBar" class="job-filter-bar" style="display:none;">
            <div class="job-filter">
                <select id="locationFilter" class="filter-select">
                    <option value="all">All locations</option>
                </select>
                <svg class="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="job-filter">
                <select id="teamFilter" class="filter-select">
                    <option value="all">All teams</option>
                </select>
                <svg class="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
    </div>
    <div id="activeFilters" class="active-filters"></div>
    <p class="results-count" id="resultsCount"></p>
</div>

<div id="jobListings">
    <div class="loading-state" id="loadingState">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    </div>
</div>

<div id="applyModal" class="modal-overlay">
    <div class="modal">
        <button class="modal-close" type="button">&times;</button>
        <div class="modal-body">
            <div class="modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <h3>Apply for <span id="jobDesingation" class="modal-job-title">Designation</span></h3>
            <form id="applyForm" method="POST" enctype="multipart/form-data" novalidate>
                <input type="hidden" name="JobID" id="modalJobId" />
                <input type="hidden" name="ReqIntID" id="modalReqIntId" />
                <input type="hidden" name="JobTitle" id="modalJobTitle" />

                <div class="form-row">
                    <div class="form-group">
                        <label>First Name <span class="required">*</span></label>
                        <input type="text" name="FirstName" placeholder="John" required data-validate>
                        <span class="field-error"></span>
                    </div>
                    <div class="form-group">
                        <label>Last Name <span class="required">*</span></label>
                        <input type="text" name="LastName" placeholder="Doe" required data-validate>
                        <span class="field-error"></span>
                    </div>
                </div>

                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" name="Email" placeholder="john@company.com" required data-validate>
                    <span class="field-error"></span>
                </div>

                <div class="form-group">
                    <label>Mobile Number <span class="required">*</span></label>
                    <input type="tel" name="MobileNumber" placeholder="+1 (555) 000-0000" required data-validate>
                    <span class="field-error"></span>
                </div>

                <div class="form-group">
                    <label>Resume <span class="required">*</span></label>
                    <div class="file-drop" id="fileDrop">
                        <div class="file-drop-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>
                        <p class="file-drop-text">Drag & drop or <span class="file-link">browse</span></p>
                        <p class="file-drop-hint">PDF, DOC, DOCX &bull; Max 2MB</p>
                        <input type="file" name="ResumeFile" id="ResumeFile" accept=".pdf,.doc,.docx" required hidden />
                    </div>
                    <span class="field-error"></span>
                </div>

                <button type="submit" id="submitButtonOfModel" class="btn-primary btn-full">
                    <span class="btn-text">Submit Application</span>
                    <span class="btn-loader" style="display:none">
                        <span class="btn-spinner"></span> Submitting&hellip;
                    </span>
                </button>
            </form>
        </div>
    </div>
</div>

<div id="toast" class="toast" role="alert" aria-live="polite"></div>
