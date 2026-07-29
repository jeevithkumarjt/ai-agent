<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Careers - Tryvium</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/jobs.css">
</head>
<body>

    <nav class="saas-nav">
        <div class="nav-inner">
            <div class="nav-brand">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="#6366f1"/>
                    <path d="M8 20V12l8 6 8-6v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Tryvium</span>
            </div>
            <div class="nav-links">
                <a href="#">Platform</a>
                <a href="#">Solutions</a>
                <a href="#" class="active">Careers</a>
                <a href="#">Contact</a>
            </div>
        </div>
    </nav>

    <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
            <span class="hero-badge">Now Hiring</span>
            <h1>Join the team shaping <span class="gradient-text">the future</span></h1>
            <p>We're looking for passionate people to build the next generation of enterprise solutions. Find your role below.</p>
            <div class="hero-stats">
                <div class="stat"><span class="stat-num" id="statOpen">0</span><span class="stat-label">Open Positions</span></div>
                <div class="stat"><span class="stat-num" id="statTeams">0</span><span class="stat-label">Teams</span></div>
                <div class="stat"><span class="stat-num" id="statLocations">0</span><span class="stat-label">Locations</span></div>
            </div>
        </div>
    </section>

    <main class="saas-main">
        <div class="container">

            <?php require __DIR__ . '/view/jobs-view.php'; ?>

        </div>
    </main>

    <footer class="saas-footer">
        <div class="container">
            <div class="footer-inner">
                <p>&copy; 2026 Tryvium. All rights reserved.</p>
                <div class="footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="mailto:hiring@sensiple.com">hiring@sensiple.com</a>
                </div>
            </div>
        </div>
    </footer>

    <script src="js/jobs.js"></script>
</body>
</html>
