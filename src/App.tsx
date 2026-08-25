import { useEffect, useRef, useState } from 'react';

const VIDEO_SOURCE = '/Nike-Sneaker.mp4';

// Original video: 10 seconds
// New video: 8 seconds
// 460vh × (10 / 8) = 575vh
// This keeps the perceived frame-change speed approximately the same.
const SCRUB_SPACE = 575;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [stage, setStage] = useState('Assembled');
  const [cursor, setCursor] = useState({
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    const updateTarget = () => {
      const scrubStage = stageRef.current;

      if (!scrubStage) return;

      /*
       * Calculate scrolling only inside the sneaker showcase section.
       *
       * This prevents the video from continuing to scrub while the user
       * is already past the main sneaker section.
       */
      const stageTop = scrubStage.offsetTop;
      const stageHeight = scrubStage.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrollableDistance = Math.max(
        1,
        stageHeight - viewportHeight
      );

      const scrollPosition = window.scrollY - stageTop;

      const progress = Math.min(
        1,
        Math.max(0, scrollPosition / scrollableDistance)
      );

      targetProgressRef.current = progress;

      setHasScrolled(progress > 0.48);

      setStage(
        progress < 0.34
          ? 'Assembled'
          : progress < 0.68
            ? 'In motion'
            : 'Unleashed'
      );
    };

    const animate = () => {
      const video = videoRef.current;

      /*
       * Smooth the scroll progress so the video doesn't jump rapidly
       * between frames.
       *
       * A smaller value makes the animation smoother/slower.
       */
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * 0.12;

      if (
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0
      ) {
        const nextTime = Math.min(
          video.duration,
          Math.max(
            0,
            currentProgressRef.current * video.duration
          )
        );

        /*
         * Only update the video when the difference is meaningful.
         * This prevents unnecessary currentTime assignments.
         */
        if (Math.abs(video.currentTime - nextTime) > 0.003) {
          video.currentTime = nextTime;
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    updateTarget();

    window.addEventListener('scroll', updateTarget, {
      passive: true,
    });

    window.addEventListener('resize', updateTarget);

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', updateTarget);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const moveCursor = (event: MouseEvent) => {
      setCursor({
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });
    };

    const hideCursor = () => {
      setCursor((current) => ({
        ...current,
        visible: false,
      }));
    };

    window.addEventListener('mousemove', moveCursor);

    document.documentElement.addEventListener(
      'mouseleave',
      hideCursor
    );

    return () => {
      window.removeEventListener('mousemove', moveCursor);

      document.documentElement.removeEventListener(
        'mouseleave',
        hideCursor
      );
    };
  }, []);

  const handleMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;

    setIsReady(true);
  };

  return (
    <main className="scrub-page">
      <nav className="site-nav" aria-label="Main navigation">
        <div className="nav-pill">
          <span className="nav-brand">AIR</span>

          <div className="nav-links">
            <a href="#story">Story</a>
            <a href="#craft">Craft</a>
            <a href="#experience">Experience</a>
          </div>

          <span className="nav-status">01</span>
        </div>
      </nav>

      <section
        ref={stageRef}
        id="experience"
        className="scrub-stage"
        style={{ height: `${SCRUB_SPACE}vh` }}
        aria-label="Scroll-controlled sneaker showcase"
      >
        <video
          ref={videoRef}
          className="showcase-video"
          src={VIDEO_SOURCE}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleMetadata}
          aria-hidden="true"
        />

        <div
          className="cinematic-vignette"
          aria-hidden="true"
        />

        <div
          className={`intro-copy ${
            hasScrolled ? 'is-hidden' : ''
          }`}
        >
          <span className="eyebrow">
            Nike / Air — 01
          </span>

          <h1>Designed to move.</h1>

          <span className="scroll-prompt">
            Scroll to reveal{' '}
            <span className="scroll-arrow">↓</span>
          </span>
        </div>

        <div
          className={`story-copy ${
            hasScrolled ? 'is-active' : ''
          }`}
          aria-hidden="true"
        >
          <span className="story-kicker">
            The future of flight
          </span>

          <span className="story-title">
            Every layer
            <br />
            has a purpose.
          </span>

          <span className="story-stage">
            {stage}
          </span>
        </div>

        <div
          className="video-caption"
          aria-hidden="true"
        >
          <span>Scroll controlled film</span>
          <span>01 / 01</span>
        </div>

        {!isReady && (
          <div
            className="loading-mark"
            aria-label="Loading"
          />
        )}
      </section>

      <section
        id="story"
        className="anchor-section"
        aria-hidden="true"
      />

      <section
        id="craft"
        className="anchor-section"
        aria-hidden="true"
      />

      <div
        className={`cosmic-cursor ${
          cursor.visible ? 'is-visible' : ''
        }`}
        style={{
          transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
        }}
        aria-hidden="true"
      />
    </main>
  );
}

export default App;
