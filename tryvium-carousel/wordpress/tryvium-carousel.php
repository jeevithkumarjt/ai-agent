<?php
/**
 * Plugin Name:       Tryvium AI — Solutions Showcase
 * Description:       AI Solutions Showcase carousel with living orbs. Each solution routes to its own voice-agent API. Shortcode: [tryvium_carousel]
 * Version:           1.0.0
 * Author:            Tryvium
 * Text Domain:       tryvium-carousel
 *
 * Usage
 * -----
 *   [tryvium_carousel]                                        → default head + demo solutions
 *   [tryvium_carousel eyebrow="AI Solutions" title="Your voice, on brand."]
 *   [tryvium_carousel api_base="https://api.tryvium.ai/v1"]
 *   [tryvium_carousel endpoint="https://api.tryvium.ai/v1/solutions"]
 *   [tryvium_carousel delay="3600"]
 *
 * Data / API wiring
 * -----------------
 * Every solution card carries its own `api` block ({ baseUrl, path, key }).
 * Configure them in WordPress by filtering 'tryvium_carousel_solutions'
 * (array of contract objects). The per-feature session endpoints are then:
 *     POST   {baseUrl}{path}/sessions
 *     POST   {baseUrl}{path}/sessions/{id}/messages
 *     DELETE {baseUrl}{path}/sessions/{id}
 * `api_base` attribute supplies the default baseUrl for every card.
 * When baseUrl/key are absent the widget runs in demo mode automatically.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TRYVIUM_CAROUSEL_VERSION', '1.0.0' );

/**
 * Default solutions payload (empty → JS falls back to its built-in demo set).
 * Populate via the filter below to drive cards + per-feature APIs from PHP.
 */
function tryvium_carousel_default_solutions() {
	return apply_filters( 'tryvium_carousel_solutions', array() );
}

/**
 * Settings passed to JS via wp_localize_script.
 * Filters: tryvium_carousel_settings, tryvium_carousel_solutions.
 */
function tryvium_carousel_settings() {
	$settings = apply_filters( 'tryvium_carousel_settings', array(
		'apiBase'  => '',
		'endpoint' => '',
		'delay'    => 4200,
		'headers'  => array(),
	) );
	return $settings;
}

/**
 * Enqueue CSS/JS only on posts/pages that actually use the shortcode.
 */
function tryvium_carousel_enqueue() {
	global $post;
	if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'tryvium_carousel' ) ) {
		return;
	}

	$base = plugin_dir_url( __FILE__ );

	wp_enqueue_style(
		'tryvium-carousel',
		$base . 'assets/css/tryvium-carousel.css',
		array(),
		TRYVIUM_CAROUSEL_VERSION
	);

	wp_enqueue_script(
		'tryvium-carousel',
		$base . 'assets/js/tryvium-carousel.js',
		array(),
		TRYVIUM_CAROUSEL_VERSION,
		true // in footer
	);

	wp_localize_script( 'tryvium-carousel', 'TryviumCarousel', tryvium_carousel_settings() );
}
add_action( 'wp_enqueue_scripts', 'tryvium_carousel_enqueue' );

/**
 * LiteSpeed cache: never combine / minify / defer the showcase bundle.
 * Keeps the canvas engines safe from reordering/truncation.
 */
function tryvium_carousel_litespeed_excludes( $excludes ) {
	$excludes[] = 'tryvium-carousel.js';
	$excludes[] = 'tryvium-carousel.css';
	return $excludes;
}
add_filter( 'litespeed_optimize_js_excludes', 'tryvium_carousel_litespeed_excludes' );
add_filter( 'litespeed_optimize_css_excludes', 'tryvium_carousel_litespeed_excludes' );

/**
 * Shortcode render. Markup fragment is tiny — the JS builds the carousel,
 * dots, caption CTA and the call modal to keep the DOM minimal and fast.
 */
function tryvium_carousel_shortcode( $atts ) {
	$atts = shortcode_atts( array(
		'eyebrow' => 'AI Solutions',
		'title'   => 'Talk to your customers <em>in their voice.</em>',
		'sub'     => 'A production voice agent for every line of business — one dedicated API per solution.',
		'delay'   => '',
		'api_base' => '',
		'endpoint' => '',
	), $atts, 'tryvium_carousel' );

	$solutions = tryvium_carousel_default_solutions();
	$settings  = tryvium_carousel_settings();

	/* per-instance attributes override global settings */
	$api_base  = $atts['api_base'] !== '' ? $atts['api_base'] : $settings['apiBase'];
	$endpoint  = $atts['endpoint'] !== '' ? $atts['endpoint'] : $settings['endpoint'];
	$delay     = $atts['delay'] !== '' ? intval( $atts['delay'] ) : $settings['delay'];

	$solutions_json = wp_json_encode( $solutions );
	$solutions_attr = $solutions_json ? esc_attr( $solutions_json ) : '';

	$title = wp_kses_post( $atts['title'] );
	$sub   = wp_kses_post( $atts['sub'] );
	$eyebrow = esc_html( $atts['eyebrow'] );

	ob_start();
	?>
<section class="tvx-root" data-solutions="<?php echo $solutions_attr; ?>"
	 data-api-base="<?php echo esc_attr( $api_base ); ?>"
	 data-endpoint="<?php echo esc_attr( $endpoint ); ?>"
	 data-delay="<?php echo esc_attr( $delay ); ?>">
	<canvas class="tvx-ambient" aria-hidden="true"></canvas>
	<div class="tvx-vignette" aria-hidden="true"></div>
	<div class="tvx-shell">
		<header class="tvx-head">
			<p class="tvx-eyebrow"><i aria-hidden="true"></i><?php echo $eyebrow; ?></p>
			<h2 class="tvx-title"><?php echo $title; ?></h2>
			<p class="tvx-sub"><?php echo $sub; ?></p>
		</header>
		<div class="tvx-stage-zone" data-zone="stage" aria-label="<?php esc_attr_e( 'Tryvium AI solutions', 'tryvium-carousel' ); ?>"></div>
		<noscript><p style="padding:1.5rem;text-align:center">Enable JavaScript to explore the AI solutions showcase.</p></noscript>
	</div>
</section>
	<?php
	return ob_get_clean();
}
add_shortcode( 'tryvium_carousel', 'tryvium_carousel_shortcode' );
