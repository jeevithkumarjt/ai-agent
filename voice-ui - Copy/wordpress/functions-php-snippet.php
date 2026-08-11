<?php
/**
 * Tryvium Voice UI — enqueue snippet
 * --------------------------------------------------------------------------
 * Paste into your theme's functions.php (or a mu-plugin). Only loads the
 * Voice UI assets on pages that contain the [voice_ui] shortcode, and keeps
 * them out of LiteSpeed's combine to preserve script order.
 *
 * Customize scenarios by filtering 'voice_ui_scenarios' (see shortcode file).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function voice_ui_assets() {
	if ( ! is_singular() ) {
		return;
	}

	// Build path to the built bundles in this plugin/theme folder.
	$base = get_template_directory_uri() . '/voice-ui/build/'; // adjust to your install path
	$base_path = get_template_directory() . '/voice-ui/build/';

	if ( ! file_exists( $base_path . 'voice-ui.min.css' ) ) {
		return;
	}

	wp_enqueue_style(
		'voice-ui',
		$base . 'voice-ui.min.css',
		array(),
		filemtime( $base_path . 'voice-ui.min.css' )
	);

	wp_enqueue_script(
		'voice-ui',
		$base . 'voice-ui.min.js',
		array(),
		filemtime( $base_path . 'voice-ui.min.js' ),
		true // in the footer — the IIFE namespace waits for DOM-ready itself.
	);

	// Optional runtime config, e.g. voice mode gate.
	wp_localize_script( 'voice-ui', 'VoiceUIConfig', apply_filters( 'voice_ui_config', array(
		'mode' => 'demo',
	) ) );

	// LiteSpeed Cache: keep the bundle out of CSS/JS combine so load order is
	// preserved (the single bundle already is the minified combine).
	add_filter( 'litespeed_optimize_css', '__return_false' );
	add_filter( 'litespeed_optimize_js', '__return_false' );
}
add_action( 'wp_enqueue_scripts', 'voice_ui_assets' );
