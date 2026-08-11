<?php
/**
 * Tryvium Voice UI — shortcode
 * --------------------------------------------------------------------------
 * Registers [voice_ui] which renders the widget fragment. Works with the
 * enqueue snippet above. Scenarios come from the filter voice_ui_scenarios —
 * fall back to the demo set built into the JS bundle.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function voice_ui_shortcode() {
	// Scenarios are delivered to JS via the bundle's built-in demo data.
	// To serve your own, filter 'voice_ui_scenarios' to an array of
	// {id,title,tag,orb,blurb,greeting,replies,prompts} objects.
	$scenarios = apply_filters( 'voice_ui_scenarios', array() );

	ob_start();
	?>
<div class="vui-root" data-scenarios="<?php echo esc_attr( wp_json_encode( $scenarios ) ); ?>">
	<div class="vui-bg" role="presentation" aria-hidden="true"></div>
	<div class="vui-app-main">
		<section class="vui-hero">
			<div class="vui-container">
				<div class="vui-hero__grid">
					<div class="vui-hero__copy">
						<p class="vui-overline vui-enter" style="--vui-enter-delay:0ms"><?php esc_html_e( 'Talk, type, get answers', 'voice-ui' ); ?></p>
						<h1 class="vui-hero__title vui-enter" style="--vui-enter-delay:70ms"><?php esc_html_e( 'Your voice, served instantly.', 'voice-ui' ); ?></h1>
						<p class="vui-lead vui-enter" style="--vui-enter-delay:140ms"><?php esc_html_e( 'A premium AI voice experience for your front desk — natural, fast, on-brand.', 'voice-ui' ); ?></p>
						<div class="vui-hero__cta vui-enter" style="--vui-enter-delay:210ms">
							<button type="button" class="vui-btn vui-btn--primary"><span class="vui-btn__label"><?php esc_html_e( 'Start a call', 'voice-ui' ); ?></span><svg class="vui-btn__icon" aria-hidden="true"><use href="#icon-phone"></use></svg></button>
							<button type="button" class="vui-btn vui-btn--ghost"><?php esc_html_e( 'Browse scenarios', 'voice-ui' ); ?></button>
						</div>
					</div>
					<div class="vui-hero__visual">
						<div class="vui-hero__glow" aria-hidden="true"></div>
						<div class="vui-hero__card vui-enter" style="--vui-enter-delay:280ms">
							<div class="vui-hero__bar-track"><div class="vui-hero__bar"></div></div>
							<div class="vui-hero__status"><span class="vui-status-dot"></span><span>Assistant online</span></div>
							<div class="vui-hero__float vui-hero__float--a" aria-hidden="true">Scheduled for you</div>
							<div class="vui-hero__float vui-hero__float--b" aria-hidden="true">Claim filed · 48h</div>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section class="vui-section vui-section--md" aria-labelledby="vui-scenarios-title">
			<div class="vui-container">
				<h2 id="vui-scenarios-title" class="vui-section-title"><?php esc_html_e( 'Pick a scenario', 'voice-ui' ); ?></h2>
				<div class="vui-carousel" role="region" aria-label="<?php esc_attr_e( 'Voice scenarios', 'voice-ui' ); ?>"></div>
			</div>
		</section>
	</div>
</div>
	<?php
	return ob_get_clean();
}
add_shortcode( 'voice_ui', 'voice_ui_shortcode' );
