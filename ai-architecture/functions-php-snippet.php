<?php
/**
 * Agent Widget — asset enqueue
 *
 * 1. Upload agent-widget.css and agent-widget.js to:
 *      wp-content/themes/<your-theme>/assets/agent-widget/
 *    (adjust AGENT_WIDGET_DIR below if you put them elsewhere, e.g. a
 *    child theme or an mu-plugin folder)
 *
 * 2. Paste this whole block into functions.php (or a Code Snippets /
 *    WPCode snippet set to run everywhere). Do not paste the JS/CSS
 *    themselves into the HTML widget — that's the truncation trap.
 *
 * 3. Bump AGENT_WIDGET_VERSION any time you edit the JS/CSS so browsers
 *    and LiteSpeed's cache pick up the change instead of serving stale
 *    files.
 *
 * 4. After deploying: LiteSpeed Cache → Purge All.
 */

if ( ! defined( 'AGENT_WIDGET_VERSION' ) ) {
	define( 'AGENT_WIDGET_VERSION', '2.0.0' );
}

add_action( 'wp_enqueue_scripts', 'tryvium_enqueue_agent_widget' );
function tryvium_enqueue_agent_widget() {

	// Only load on pages that actually use the widget, so we're not
	// shipping canvas/audio JS site-wide. Adjust the check to match
	// however you're placing it (page slug, template, Elementor
	// condition, etc.) — is_front_page() is just a starting point.
	if ( ! is_front_page() && ! is_page( 'talk-to-an-agent' ) ) {
		return;
	}

	$base_uri = get_stylesheet_directory_uri() . '/assets/agent-widget';
	$base_dir = get_stylesheet_directory() . '/assets/agent-widget';

	wp_enqueue_style(
		'agent-widget',
		$base_uri . '/agent-widget.css',
		array(),
		AGENT_WIDGET_VERSION
	);

	wp_enqueue_script(
		'agent-widget',
		$base_uri . '/agent-widget.js',
		array(), // no jQuery dependency — plain ES5
		AGENT_WIDGET_VERSION,
		true // load in footer
	);

	// Google Fonts used by the widget (Manrope + Inter). If the theme
	// already loads these, drop this block to avoid a duplicate request.
	wp_enqueue_style(
		'agent-widget-fonts',
		'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap',
		array(),
		null
	);
}

/**
 * Optional: exclude these from LiteSpeed's CSS/JS combine + minify.
 * Not strictly required for this file since it's already ES5 with no
 * template literals, but combine can still reorder load sequence on
 * some setups — safer to exclude while you're validating it live, then
 * remove this filter once you've confirmed combine doesn't break it.
 */
add_filter( 'litespeed_optimize_js_excludes', 'tryvium_agent_widget_js_exclude' );
function tryvium_agent_widget_js_exclude( $excludes ) {
	$excludes[] = 'agent-widget.js';
	return $excludes;
}
add_filter( 'litespeed_optimize_css_excludes', 'tryvium_agent_widget_css_exclude' );
function tryvium_agent_widget_css_exclude( $excludes ) {
	$excludes[] = 'agent-widget.css';
	return $excludes;
}
