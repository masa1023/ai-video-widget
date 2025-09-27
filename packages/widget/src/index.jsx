import { render } from 'preact';
import './style.css';

function VideoWidget() {
	return (
		<div class="video-widget">
			<div style={{ padding: '16px', textAlign: 'center' }}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
					Video Widget
				</h3>
				<p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
					Ready for video player integration
				</p>
			</div>
		</div>
	);
}

function init() {
	const container = document.createElement('div');
	document.body.appendChild(container);
	render(<VideoWidget />, container);
}

if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
}

window.VideoWidget = { init };
