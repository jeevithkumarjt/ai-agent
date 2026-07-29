<?php
/* ==========================================================
* CAREERS PAGE — SEARCH + FILTERS + RESILIENT LOADING
* HTML/CSS in shortcode. JS injected via wp_add_inline_script
* in wp_footer to avoid Elementor HTML-widget script truncation
* and LiteSpeed minifier corruption.
* ========================================================== */

add_shortcode('exelare_jobs', 'render_exelare_jobs_shortcode');

function render_exelare_jobs_shortcode()
{
    ob_start();
?>

    <div id="jobListingsWrapper">

        <div id="jobToolbar" class="job-toolbar" style="display:none;">
            <div class="job-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="jobSearchInput" placeholder="Search by job title…" autocomplete="off" />
            </div>

            <div class="job-filter">
                <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                    <circle cx="12" cy="12" r="9"></circle>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <path d="M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z"></path>
                </svg>
                <select id="locationFilter" class="filter-select">
                    <option value="all">All locations</option>
                </select>
            </div>

            <div class="job-filter">
                <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                </svg>
                <select id="teamFilter" class="filter-select">
                    <option value="all">All teams</option>
                </select>
            </div>
        </div>

        <div id="jobResultCount" class="job-result-count" style="display:none;"></div>

        <div id="jobListings">
            <div class="job-skeleton-wrap">
                <div class="job-skeleton"></div>
                <div class="job-skeleton"></div>
                <div class="job-skeleton"></div>
            </div>
        </div>
    </div>

    <!-- Apply Modal -->
    <div id="applyModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h4>Apply for <span id="jobDesingation">Designation</span></h4>
            <form id="applyForm" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="JobID" id="modalJobId" />
                <input type="hidden" name="ReqIntID" id="modalReqIntId" />
                <input type="hidden" name="JobTitle" id="modalJobTitle" />

                <div class="form-group">
                    <label>First Name*</label>
                    <input type="text" name="FirstName" required />
                </div>
                <div class="form-group">
                    <label>Last Name*</label>
                    <input type="text" name="LastName" required />
                </div>
                <div class="form-group">
                    <label>Email*</label>
                    <input type="email" name="Email" required />
                </div>
                <div class="form-group">
                    <label>Mobile Number*</label>
                    <input type="text" name="MobileNumber" required />
                </div>
                <div class="form-group">
                    <label>Upload Resume (PDF, DOC, DOCX UP TO 2MB)*</label>
                    <input type="file" name="ResumeFile" id="ResumeFile" accept=".pdf,.doc,.docx" required />
                </div>
                <button type="submit" id="submitButtonOfModel" class="submit-btn">Submit</button>
            </form>
        </div>
    </div>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
        rel="stylesheet">

    <style>
        #jobListingsWrapper,
        #jobListingsWrapper * {
            font-family: "Manrope", sans-serif;
            box-sizing: border-box;
            text-align: left;
            /* override any inherited center-align from theme/section */
        }

        .job-toolbar {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 20px;
            padding-bottom: 18px;
            border-bottom: 1px solid #E7E7EA;
        }

        .job-search {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1 1 260px;
            background: #F7F7F8;
            border: 1px solid #E7E7EA;
            border-radius: 10px;
            padding: 10px 14px;
        }

        .job-search svg {
            width: 17px;
            height: 17px;
            color: #8a8a94;
            flex-shrink: 0;
        }

        .job-search input {
            border: none;
            background: transparent;
            outline: none;
            font-size: 14px;
            color: #111;
            width: 100%;
            font-family: "Manrope", sans-serif;
            text-align: left;
        }

        .job-filter {
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #E7E7EA;
            border-radius: 10px;
            padding: 10px 14px;
            background: #fff;
            flex: 0 0 auto;
        }

        .job-filter .filter-icon {
            width: 16px;
            height: 16px;
            color: #6b6b76;
            flex-shrink: 0;
        }

        .filter-select {
            font-family: "Manrope", sans-serif !important;
            font-size: 14px;
            font-weight: 500;
            color: #111;
            border: none;
            background: transparent;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            cursor: pointer;
            outline: none;
            min-width: 110px;
            text-align: left;
        }

        .job-result-count {
            font-size: 13px;
            color: #8a8a94;
            margin-bottom: 18px;
            text-align: left;
        }

        @media (max-width: 640px) {
            .job-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .job-search,
            .job-filter {
                width: 100%;
            }
        }

        .job-skeleton-wrap {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .job-skeleton {
            height: 96px;
            border-radius: 16px;
            background: linear-gradient(90deg, #F0F0F2 25%, #F7F7F8 37%, #F0F0F2 63%);
            background-size: 400% 100%;
            animation: skeletonShimmer 1.4s ease infinite;
        }

        @keyframes skeletonShimmer {
            0% {
                background-position: 100% 50%;
            }

            100% {
                background-position: 0 50%;
            }
        }

        .job-error-state {
            text-align: left;
            padding: 40px 20px;
            border: 1px dashed #E7E7EA;
            border-radius: 16px;
            color: #555;
        }

        .job-error-state p {
            margin: 0 0 14px;
            font-size: 14px;
        }

        .retry-btn {
            background-color: #111;
            color: #fff;
            border: none;
            border-radius: 24px;
            padding: 10px 22px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        .retry-btn:hover {
            background-color: #333;
        }

        .job-empty-state {
            text-align: left;
            padding: 48px 0;
            color: #555;
        }

        .job-empty-state svg {
            width: 42px;
            height: 42px;
            color: #d0d0d5;
            margin-bottom: 14px;
        }

        .job-empty-state p {
            margin: 0 0 6px;
            font-size: 15px;
        }

        .job-empty-state a {
            color: #F26E26;
            font-weight: 600;
            text-decoration: none;
        }

        .job-empty-state a:hover {
            text-decoration: underline;
        }

        .no-results-msg {
            font-style: italic;
            color: #666;
            padding: 20px 0;
            text-align: left;
        }

        .job-category-group {
            max-width: 100%;
            margin: 0 auto 8px;
        }

        .job-category-heading {
            font-family: "Red Hat Display", sans-serif !important;
            font-size: 20px;
            font-weight: 700;
            color: #111;
            margin: 32px 0 14px;
            text-align: left;
        }

        .job-category-group:first-of-type .job-category-heading {
            margin-top: 0;
        }

        .job-card {
            background: #ffffff;
            border: 1px solid #E7E7EA;
            border-radius: 16px;
            padding: 22px 26px;
            margin-bottom: 16px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
            transition: box-shadow .2s ease, border-color .2s ease;
            text-align: left;
        }

        .job-card:hover {
            box-shadow: 0 4px 14px rgba(16, 24, 40, 0.07);
            border-color: #ddd;
        }

        .job-card-left {
            flex: 1 1 320px;
            min-width: 0;
            text-align: left;
        }

        .job-title {
            font-family: "Red Hat Display", sans-serif !important;
            font-size: 17px;
            font-weight: 700;
            color: #101828;
            margin: 0 0 10px;
            text-align: left;
        }

        .job-meta {
            font-size: 14px;
            color: #6b6b76;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 8px;
            text-align: left;
        }

        .job-meta .meta-divider {
            color: #d0d0d5;
        }

        .job-description {
            font-size: 14px;
            color: #444;
            display: none;
            margin-top: 12px;
            line-height: 1.7;
            text-align: left;
        }

        .job-description.expanded {
            display: block;
        }

        .bottom-toggle {
            display: block;
            margin-top: 16px;
        }

        .toggle-desc {
            background: none;
            border: none;
            padding: 0;
            font-size: 14px;
            font-weight: 600;
            color: #F26E26;
            cursor: pointer;
            display: block;
            text-align: left;
        }

        .toggle-desc:hover {
            text-decoration: underline;
        }

        .job-card-right {
            display: flex;
            align-items: center;
            gap: 18px;
            flex: 0 0 auto;
        }

        .job-location {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #3f3f46;
            white-space: nowrap;
        }

        .job-location span {
            order: 1;
        }

        .job-location svg {
            order: 2;
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            color: #6b6b76;
        }

        .card-vertical-divider {
            order: 3;
            width: 1px;
            height: 28px;
            background: #E7E7EA;
        }

        .apply-btn {
            background-color: #F26E26;
            color: #fff;
            border: none;
            border-radius: 24px;
            padding: 11px 22px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: box-shadow .25s ease, background-color .25s ease;
        }

        .apply-btn:hover {
            background-color: #e0611e;
            box-shadow: 0 0 0 4px rgba(242, 110, 38, 0.18);
        }

        @media (max-width: 768px) {
            .job-card {
                flex-direction: column;
                align-items: flex-start;
                padding: 18px;
            }

            .job-card-left {
                flex: 1 1 100%;
                width: 100%;
                min-width: 100%;
            }

            .job-card-right {
                width: 100%;
                justify-content: space-between;
            }

            .card-vertical-divider {
                display: none;
            }
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 9999;
            padding-top: 60px;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            overflow: auto;
        }

        .modal-content {
            background-color: #fff;
            margin: auto;
            padding: 30px 25px;
            border-radius: 10px;
            max-width: 450px;
            animation: fadeIn 0.4s ease;
            font-family: "Manrope", sans-serif;
            text-align: left;
        }

        .modal-content h4 {
            font-family: "Red Hat Display", sans-serif !important;
            margin-bottom: 20px;
            font-size: 20px;
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            line-height: 20px;
        }

        .close:hover,
        .close:focus {
            color: #000;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            text-align: left;
        }

        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: "Manrope", sans-serif;
            text-align: left;
        }

        .submit-btn {
            background-color: #0178b6;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }

        .submit-btn:hover {
            background-color: #015a8f;
        }

        .submit-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>

<?php
    return ob_get_clean();
}

/* ==========================================================
* JS — enqueued via wp_add_inline_script in the footer.
* No template literals (LiteSpeed-minifier safe) and this
* bypasses the Elementor HTML-widget script truncation limit
* entirely, since it never lives inside the widget content.
* ========================================================== */

add_action('wp_enqueue_scripts', 'exelare_jobs_enqueue_script');

function exelare_jobs_enqueue_script()
{

    // Only load on pages that actually contain the shortcode.
    if (!is_a(get_post(), 'WP_Post') || !has_shortcode(get_post()->post_content, 'exelare_jobs')) {
        return;
    }

    wp_register_script('exelare-jobs-init', false, [], null, true);
    wp_enqueue_script('exelare-jobs-init');

    $ajax_get_url    = admin_url('admin-ajax.php?action=get_jobs_secure');
    $ajax_submit_url = admin_url('admin-ajax.php?action=submit_and_link');

    $js = "
document.addEventListener('DOMContentLoaded', function() {

    function escapeHtml(text) {
        var d = document.createElement('div');
        d.textContent = text == null ? '' : text;
        return d.innerHTML;
    }

    var globeIcon = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\">' +
        '<circle cx=\"12\" cy=\"12\" r=\"9\"></circle>' +
        '<line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"></line>' +
        '<path d=\"M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3Z\"></path>' +
        '</svg>';

    var allJobs = [];

    var container     = document.getElementById('jobListings');
    var toolbar        = document.getElementById('jobToolbar');
    var resultCount    = document.getElementById('jobResultCount');
    var searchInput    = document.getElementById('jobSearchInput');
    var locationSelect = document.getElementById('locationFilter');
    var teamSelect     = document.getElementById('teamFilter');

    if (!container) return;

    function normalizeJob(job) {
        job._category = job.JobCategory || job.Category || job.Department || job.Practice || job.JobType || 'Other';
        job._location = job.Location || 'Other';
        return job;
    }

    function uniqueSorted(arr) {
        var seen = {};
        var out = [];
        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (v && !seen[v]) { seen[v] = true; out.push(v); }
        }
        out.sort();
        return out;
    }

    function populateFilterOptions(jobs) {
        var locations = uniqueSorted(jobs.map(function(j){ return j._location; }));
        var teams = uniqueSorted(jobs.map(function(j){ return j._category; }));

        var locHtml = '<option value=\"all\">All locations</option>';
        for (var i = 0; i < locations.length; i++) {
            locHtml += '<option value=\"' + escapeHtml(locations[i]) + '\">' + escapeHtml(locations[i]) + '</option>';
        }
        locationSelect.innerHTML = locHtml;

        var teamHtml = '<option value=\"all\">All teams</option>';
        for (var j = 0; j < teams.length; j++) {
            teamHtml += '<option value=\"' + escapeHtml(teams[j]) + '\">' + escapeHtml(teams[j]) + '</option>';
        }
        teamSelect.innerHTML = teamHtml;
    }

    function buildJobCard(job) {
        var exp = job.TotalExp || job.Experience || '';
        var shift = job.Shift || job.ShiftTiming || job.WorkShift || '';
        var reqId = escapeHtml(job.ReqIntID || '');

        var metaHtml = '';
        if (exp) metaHtml += '<span>Exp: ' + escapeHtml(exp) + '</span>';
        if (exp && shift) metaHtml += '<span class=\"meta-divider\">|</span>';
        if (shift) metaHtml += '<span>Shift: ' + escapeHtml(shift) + '</span>';

        var html = '';
        html += '<div class=\"job-card-left\">';
        html += '<h4 class=\"job-title\">' + escapeHtml(job.JobTitle || '') + '</h4>';
        html += '<div class=\"job-meta\">' + metaHtml + '</div>';
        html += '<button class=\"toggle-desc\" data-target=\"desc-' + reqId + '\">Show More</button>';
        html += '<div class=\"job-description\" id=\"desc-' + reqId + '\">';
        html += (job.Description || '');
        html += '<button class=\"toggle-desc bottom-toggle\" data-target=\"desc-' + reqId + '\">Show Less</button>';
        html += '</div>';
        html += '</div>';
        html += '<div class=\"job-card-right\">';
        html += '<div class=\"job-location\"><span>' + escapeHtml(job._location || '') + '</span>' + globeIcon + '</div>';
        html += '<div class=\"card-vertical-divider\"></div>';
        html += '<button type=\"button\" class=\"apply-btn\" data-reqintid=\"' + reqId + '\" data-jobtitle=\"' + escapeHtml(job.JobTitle || '') + '\">Apply Now</button>';
        html += '</div>';

        return html;
    }

    function renderJobs(jobs) {
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p class=\"no-results-msg\">No positions match your search right now. Try a different keyword, location, or team.</p>';
            resultCount.textContent = '0 positions found';
            return;
        }

        resultCount.textContent = jobs.length === 1 ? '1 position found' : (jobs.length + ' positions found');

        var groups = {};
        var order = [];
        for (var i = 0; i < jobs.length; i++) {
            var cat = jobs[i]._category;
            if (!groups[cat]) { groups[cat] = []; order.push(cat); }
            groups[cat].push(jobs[i]);
        }

        for (var g = 0; g < order.length; g++) {
            var category = order[g];
            var groupWrap = document.createElement('div');
            groupWrap.className = 'job-category-group';

            var heading = document.createElement('h3');
            heading.className = 'job-category-heading';
            heading.textContent = category;
            groupWrap.appendChild(heading);

            var jobsInGroup = groups[category];
            for (var k = 0; k < jobsInGroup.length; k++) {
                var div = document.createElement('div');
                div.className = 'job-card';
                div.innerHTML = buildJobCard(jobsInGroup[k]);
                groupWrap.appendChild(div);
            }

            container.appendChild(groupWrap);
        }
    }

    function applyFilters() {
        var query = searchInput.value.trim().toLowerCase();
        var selectedLocation = locationSelect.value;
        var selectedTeam = teamSelect.value;

        var filtered = allJobs.filter(function(job) {
            var matchesQuery = !query || (job.JobTitle || '').toLowerCase().indexOf(query) !== -1;
            var matchesLocation = selectedLocation === 'all' || job._location === selectedLocation;
            var matchesTeam = selectedTeam === 'all' || job._category === selectedTeam;
            return matchesQuery && matchesLocation && matchesTeam;
        });

        renderJobs(filtered);
    }

    var searchDebounce;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(applyFilters, 200);
    });
    locationSelect.addEventListener('change', applyFilters);
    teamSelect.addEventListener('change', applyFilters);

    function showEmptyState() {
        toolbar.style.display = 'none';
        resultCount.style.display = 'none';
        var html = '';
        html += '<div class=\"job-empty-state\">';
        html += '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\">';
        html += '<path d=\"M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z\"></path>';
        html += '<path d=\"M16 21V5a1 1 0 00-1-1H9a1 1 0 00-1 1v16\"></path>';
        html += '</svg>';
        html += '<p><strong>No open roles at the moment.</strong></p>';
        html += '<p>We are always looking for great people — send your resume to ';
        html += '<a href=\"mailto:hiring@sensiple.com\">hiring@sensiple.com</a> and we will reach out when something opens up.</p>';
        html += '</div>';
        container.innerHTML = html;
    }

    function showErrorState() {
        toolbar.style.display = 'none';
        resultCount.style.display = 'none';
        var html = '';
        html += '<div class=\"job-error-state\">';
        html += '<p>We could not load open positions right now. This is usually temporary.</p>';
        html += '<button type=\"button\" class=\"retry-btn\" id=\"retryLoadJobs\">Try again</button>';
        html += '</div>';
        container.innerHTML = html;
        var retryBtn = document.getElementById('retryLoadJobs');
        if (retryBtn) retryBtn.addEventListener('click', loadJobs);
    }

    function loadJobs() {
        container.innerHTML = '<div class=\"job-skeleton-wrap\"><div class=\"job-skeleton\"></div><div class=\"job-skeleton\"></div><div class=\"job-skeleton\"></div></div>';
        toolbar.style.display = 'none';
        resultCount.style.display = 'none';

        var controller = new AbortController();
        var timeoutId = setTimeout(function(){ controller.abort(); }, 8000);

        fetch('" . esc_js($ajax_get_url) . "', { signal: controller.signal })
            .then(function(res){ return res.json(); })
            .then(function(result) {
                clearTimeout(timeoutId);

                if (result.success && result.data && result.data.length > 0) {
                    allJobs = result.data.map(normalizeJob);
                    populateFilterOptions(allJobs);

                    toolbar.style.display = 'flex';
                    resultCount.style.display = 'block';
                    renderJobs(allJobs);
                } else {
                    showEmptyState();
                }
            })
            .catch(function(err) {
                clearTimeout(timeoutId);
                showErrorState();
            });
    }

    loadJobs();

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('apply-btn') || e.target.closest('.apply-btn')) {
            var button = e.target.classList.contains('apply-btn') ? e.target : e.target.closest('.apply-btn');
            document.getElementById('modalJobId').value = button.dataset.reqintid;
            document.getElementById('modalReqIntId').value = button.dataset.reqintid;
            document.getElementById('modalJobTitle').value = button.dataset.jobtitle;
            document.getElementById('jobDesingation').textContent = button.dataset.jobtitle;
            document.getElementById('applyModal').style.display = 'block';
        }
        if (e.target.classList.contains('close')) {
            document.getElementById('applyModal').style.display = 'none';
        }
        if (e.target.classList.contains('toggle-desc')) {
            var target = e.target.dataset.target;
            var desc = document.getElementById(target);
            var card = e.target.closest('.job-card');
            var topButton = card.querySelector('.toggle-desc:not(.bottom-toggle)');
            desc.classList.toggle('expanded');
            topButton.style.display = desc.classList.contains('expanded') ? 'none' : 'block';
        }
    });

    window.addEventListener('click', function(e) {
        var modal = document.getElementById('applyModal');
        if (e.target === modal) modal.style.display = 'none';
    });

    var applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var btn = document.getElementById('submitButtonOfModel');
            btn.disabled = true;
            btn.textContent = 'Submitting…';

            var fd = new FormData(this);
            var formEl = this;

            fetch('" . esc_js($ajax_submit_url) . "', { method: 'POST', body: fd })
                .then(function(r){ return r.json(); })
                .then(function(res) {
                    if (typeof Toastify !== 'undefined') {
                        Toastify({ text: res.data.message, duration: 4000, gravity: 'top', position: 'right', backgroundColor: res.success ? '#28a745' : 'red' }).showToast();
                    } else {
                        alert(res.data.message);
                    }
                    if (res.success) {
                        formEl.reset();
                        document.getElementById('applyModal').style.display = 'none';
                    }
                })
                .catch(function() {
                    if (typeof Toastify !== 'undefined') {
                        Toastify({ text: 'Network error', duration: 4000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast();
                    } else {
                        alert('Network error. Please try again.');
                    }
                })
                .finally(function() {
                    btn.disabled = false;
                    btn.textContent = 'Submit';
                });
        });
    }

});
";

    wp_add_inline_script('exelare-jobs-init', $js);
}

/* ==========================================================
* BACKGROUND CACHE WARMER — job data never blocks a visitor
* ========================================================== */

add_filter('cron_schedules', function ($schedules) {
    $schedules['every_thirty_minutes'] = ['interval' => 30 * 60, 'display' => 'Every 30 Minutes'];
    return $schedules;
});

add_action('wp', function () {
    if (!wp_next_scheduled('exelare_refresh_job_cache')) {
        wp_schedule_event(time(), 'every_thirty_minutes', 'exelare_refresh_job_cache');
    }
});

add_action('exelare_refresh_job_cache', 'exelare_do_refresh_job_cache');

function exelare_do_refresh_job_cache()
{

    $postData = [
        "CompanyID" => "Exl_SensipleIndia",
        "Username" => "Admin",
        "Password" => "$3nS1pl3",
        "EntityID" => "Requirements",
        "Which" => "DView",
        "WhichID" => "JobsAPI",
        "PageSize" => 100,
        "PageNumber" => 1,
        "FilterBy" => [[
            "FieldName" => "Requirements.BusinessUnit",
            "Type" => "Like",
            "FieldValue1" => "'Sensiple%'"
        ]]
    ];

    $response = wp_remote_post(
        "https://exelareweb.com/ExelareJobsAPI/api/viewrecords",
        [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($postData),
            'timeout' => 20,
        ]
    );

    if (is_wp_error($response)) {
        error_log('Exelare cache warm failed: ' . $response->get_error_message());
        return;
    }

    $body = wp_remote_retrieve_body($response);
    $jobs = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Exelare cache warm: invalid JSON response');
        return;
    }

    $jobList = $jobs['Records'] ?? [];
    set_transient('cached_job_listings_all', $jobList, 2 * DAY_IN_SECONDS);
}

/* ==========================================================
* LOAD JOBS (AJAX)
* ========================================================== */

add_action('wp_ajax_get_jobs_secure', 'get_jobs_secure');
add_action('wp_ajax_nopriv_get_jobs_secure', 'get_jobs_secure');

function get_jobs_secure()
{

    $job_data = get_transient('cached_job_listings_all');

    if ($job_data !== false && !empty($job_data)) {
        wp_send_json_success($job_data);
        return;
    }

    exelare_do_refresh_job_cache();
    $job_data = get_transient('cached_job_listings_all');

    wp_send_json_success($job_data !== false ? $job_data : []);
}

/* ==========================================================
* SUBMIT APPLICATION + LINK TO JOB (AJAX) — unchanged
* ========================================================== */

add_action('wp_ajax_submit_and_link', 'submit_and_link_handler');
add_action('wp_ajax_nopriv_submit_and_link', 'submit_and_link_handler');

function submit_and_link_handler()
{

    $first = sanitize_text_field($_POST['FirstName'] ?? '');
    $last = sanitize_text_field($_POST['LastName'] ?? '');
    $email = sanitize_email($_POST['Email'] ?? '');
    $mobile = sanitize_text_field($_POST['MobileNumber'] ?? '');
    $jobTitle = sanitize_text_field($_POST['JobTitle'] ?? '');
    $reqIntId = sanitize_text_field($_POST['ReqIntID'] ?? '');

    if ($first === '' || $last === '' || !is_email($email) || $mobile === '' || $jobTitle === '' || $reqIntId === '') {
        wp_send_json_error(['message' => 'All fields are required.']);
        return;
    }

    if (empty($_FILES['ResumeFile']) || $_FILES['ResumeFile']['error'] !== UPLOAD_ERR_OK) {
        wp_send_json_error(['message' => 'Please upload a valid resume file.']);
        return;
    }

    if ($_FILES['ResumeFile']['size'] > 2 * 1024 * 1024) {
        wp_send_json_error(['message' => 'Resume must be under 2 MB.']);
        return;
    }

    $allowed_exts = ['pdf', 'doc', 'docx'];
    $ext = strtolower(pathinfo($_FILES['ResumeFile']['name'], PATHINFO_EXTENSION));

    if (!in_array($ext, $allowed_exts)) {
        wp_send_json_error(['message' => 'Resume must be a PDF or DOC/DOCX file.']);
        return;
    }

    $resume_name = sanitize_file_name($_FILES['ResumeFile']['name']);
    $resume_content = file_get_contents($_FILES['ResumeFile']['tmp_name']);

    if ($resume_content === false) {
        wp_send_json_error(['message' => 'Failed to read resume file.']);
        return;
    }

    $resume_data = base64_encode($resume_content);

    $payload = [
        "BatchID" => 1,
        "CompanyID" => "Exl_SensipleIndia",
        "Username" => "Admin",
        "Password" => "$3nS1pl3",
        "Candidates" => [[
            "CandidateFields" => [
                "ApiSourceID" => "e96d9d65-2057-4588-a217-4b2e2db824b9",
                "ApiSourceName" => "Sensiple",
                "FirstName" => $first,
                "LastName" => $last,
                "JobTitle" => $jobTitle,
                "MobilePhone" => $mobile,
                "EMail1" => $email,
            ],
            "Resume" => [
                "FileName" => $resume_name,
                "FileContent" => $resume_data
            ],
            "LinkToJob" => [
                "ReqIntID" => $reqIntId,
                "LinkAs" => "Potential"
            ]
        ]]
    ];

    $response = wp_remote_post(
        'https://exelareweb.com/ExelareJobsAPI/api/candidatessubmit',
        [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($payload),
            'timeout' => 20
        ]
    );

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Submission failed: ' . $response->get_error_message()]);
        return;
    }

    $body = wp_remote_retrieve_body($response);
    $result = json_decode($body, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error(['message' => 'Invalid response from submission API.']);
        return;
    }

    if (!empty($result['IsError']) && $result['IsError'] === true) {
        wp_send_json_error(['message' => $result['Message'] ?? 'Something went wrong.']);
        return;
    }

    wp_send_json_success(['message' => 'Application submitted successfully!']);
}
