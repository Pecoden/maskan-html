(() => {
  const metrics = document.querySelectorAll(".company-metrics [data-metric]");
  if (!metrics.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = { completedProjects: 156, activeProjects: 45, executedArea: 620, activeArea: 213, coveredCities: 5 };
  const suffixes = { executedArea: "k", activeArea: "k" };
  const formatValue = (key, value) => `${Math.round(value)}${suffixes[key] || ""}`;
  const animateMetric = element => {
    if (element.dataset.counted) return;
    element.dataset.counted = "true";
    const key = element.dataset.metric;
    const target = targets[key];
    if (!target || reduceMotion) {
      element.textContent = formatValue(key, target || 0);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatValue(key, target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) animateMetric(entry.target);
  }), { threshold: 0.35 });
  metrics.forEach(metric => {
    const key = metric.dataset.metric;
    metric.textContent = formatValue(key, 0);
  });
  metrics.forEach(metric => observer.observe(metric));
})();
