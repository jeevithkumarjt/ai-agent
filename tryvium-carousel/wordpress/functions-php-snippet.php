<?php
/**
 * Tryvium AI — Solutions Showcase
 * ----------------------------------------------------------------------------
 * Drop-in snippet for your theme's functions.php (when you do not want to run
 * the plugin). Point TRYVIUM_CAROUSEL_URI at the folder that contains the
 * assets/ folder — the snippet lives in the theme, the assets can live in the
 * theme or anywhere else on the same site.
 *
 *   [tryvium_carousel]
 *   [tryvium_carousel eyebrow="AI Solutions" title="Talk to your customers <em>in their voice.</em>"]
 *   [tryvium_carousel api_base="https://api.tryvium.ai/v1"]
 *   [tryvium_carousel endpoint="https://api.tryvium.ai/v1/solutions"]
 *
 * Per-feature APIs: populate 'tryvium_carousel_solutions' (see docs/integration.md).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* Location of the module assets. Update to match where you upload this folder. */
if ( ! defined( 'TRYVIUM_CAROUSEL_URI' ) ) {
	define( 'TRYVIUM_CAROUSEL_URI', get_template_directory_uri() . '/tryvium-carousel' );
}
if ( ! defined( 'TRYVIUM_CAROUSEL_VERSION' ) ) {
	define( 'TRYVIUM_CAROUSEL_VERSION', '1.0.0' );
}

/* ----------------------------------------------------------------
   Enqueue — only on posts/pages that use the shortcode
   ---------------------------------------------------------------- */
function tryvium_carousel_enqueue_snippet() {
	global $post;
	if ( ! is_a( $post, 'WP_Post' ) || ! has_shortcode( $post->post_content, 'tryvium_carousel' ) ) {
		return;
	}

	$settings = apply_filters( 'tryvium_carousel_settings', array(
		'apiBase'  => '',
		'endpoint' => '',
		'delay'    => 4200,
		'headers'  => array(),
	) );

	wp_enqueue_style( 'tryvium-carousel', TRYVIUM_CAROUSEL_URI . '/assets/css/tryvium-carousel.css', array(), TRYVIUM_CAROUSEL_VERSION );
	wp_enqueue_script( 'tryvium-carousel', TRYVIUM_CAROUSEL_URI . '/assets/js/tryvium-carousel.js', array(), TRYVIUM_CAROUSEL_VERSION, true );
	wp_localize_script( 'tryvium-carousel', 'TryviumCarousel', $settings );
}
add_action( 'wp_enqueue_scripts', 'tryvium_carousel_enqueue_snippet' );

/* LiteSpeed: keep the bundle out of combine/minify */
function tryvium_carousel_litespeed_excludes_snippet( $excludes ) {
	$excludes[] = 'tryvium-carousel.js';
	$excludes[] = 'tryvium-carousel.css';
	return $excludes;
}
add_filter( 'litespeed_optimize_js_excludes', 'tryvium_carousel_litespeed_excludes_snippet' );
add_filter( 'litespeed_optimize_css_excludes', 'tryvium_carousel_litespeed_excludes_snippet' );

/* ----------------------------------------------------------------
   Shortcode
   ---------------------------------------------------------------- */
function tryvium_carousel_shortcode_snippet( $atts ) {
	$atts = shortcode_atts( array(
		'eyebrow'  => 'AI Solutions',
		'title'    => 'Talk to your customers <em>in their voice.</em>',
		'sub'      => 'A production voice agent for every line of business — one dedicated API per solution.',
		'delay'    => '',
		'api_base' => '',
		'endpoint' => '',
	), $atts, 'tryvium_carousel' );

	$solutions = apply_filters( 'tryvium_carousel_solutions', array() );
	$settings  = apply_filters( 'tryvium_carousel_settings', array(
		'apiBase' => '', 'endpoint' => '', 'delay' => 4200, 'headers' => array(),
	) );

	$api_base = $atts['api_base'] !== '' ? $atts['api_base'] : $settings['apiBase'];
	$endpoint = $atts['endpoint'] !== '' ? $atts['endpoint'] : $settings['endpoint'];
	$delay    = $atts['delay'] !== '' ? intval( $atts['delay'] ) : $settings['delay'];

	$solutions_json = wp_json_encode( $solutions );
	$solutions_attr = $solutions_json ? esc_attr( $solutions_json ) : '';

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
			<p class="tvx-eyebrow"><i aria-hidden="true"></i><?php echo esc_html( $atts['eyebrow'] ); ?></p>
			<h2 class="tvx-title"><?php echo wp_kses_post( $atts['title'] ); ?></h2>
			<p class="tvx-sub"><?php echo wp_kses_post( $atts['sub'] ); ?></p>
		</header>
		<div class="tvx-stage-zone" data-zone="stage" aria-label="<?php esc_attr_e( 'Tryvium AI solutions', 'tryvium-carousel' ); ?>"></div>
		<noscript><p style="padding:1.5rem;text-align:center">Enable JavaScript to explore the AI solutions showcase.</p></noscript>
	</div>
</section>
	<?php
	return ob_get_clean();
}
add_shortcode( 'tryvium_carousel', 'tryvium_carousel_shortcode_snippet' );
