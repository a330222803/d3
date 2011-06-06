(function(){d3.stats = {};
// Bandwidth selectors for Gaussian kernels.
// Based on R's implementations in `stats.bw`.
d3.stats.bandwidth = {

  // Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
  nrd0: function(x) {
    var hi = Math.sqrt(d3.stats.variance(x));
    if (!(lo = Math.min(hi, d3.stats.iqr(x) / 1.34)))
      (lo = hi) || (lo = Math.abs(x[1])) || (lo = 1);
    return .9 * lo * Math.pow(x.length, -.2);
  },

  // Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and
  // Visualization. Wiley.
  nrd: function(x) {
    var h = d3.stats.iqr(x) / 1.34;
    return 1.06 * Math.min(Math.sqrt(d3.stats.variance(x)), h)
      * Math.pow(x.length, -1/5);
  }
};
// See <http://en.wikipedia.org/wiki/Kernel_(statistics)>.
d3.stats.kernel = {
  uniform: function(u) {
    if (u <= 1 && u >= -1) return .5;
    return 0;
  },
  triangular: function(u) {
    if (u <= 1 && u >= -1) return 1 - Math.abs(u);
    return 0;
  },
  epanechnikov: function(u) {
    if (u <= 1 && u >= -1) return .75 * (1 - u * u);
    return 0;
  },
  quartic: function(u) {
    if (u <= 1 && u >= -1) {
      var tmp = 1 - u * u;
      return (15 / 16) * tmp * tmp;
    }
    return 0;
  },
  triweight: function(u) {
    if (u <= 1 && u >= -1) {
      var tmp = 1 - u * u;
      return (35 / 32) * tmp * tmp * tmp;
    }
    return 0;
  },
  gaussian: function(u) {
    return 1 / Math.sqrt(2 * Math.PI) * Math.exp(-.5 * u * u);
  },
  cosine: function(u) {
    if (u <= 1 && u >= -1) return Math.PI / 4 * Math.cos(Math.PI / 2 * u);
    return 0;
  }
};
// http://exploringdata.net/den_trac.htm
d3.stats.kde = function() {
  var kernel = d3.stats.kernel.gaussian,
      sample = [],
      bandwidth = d3.stats.bandwidth.nrd;

  function kde(points, i) {
    var bw = bandwidth.call(this, sample);
    return points.map(function(x) {
      var i = -1,
          y = 0,
          n = sample.length;
      while (++i < n) {
        y += kernel((x - sample[i]) / bw);
      }
      return [x, y / bw / n];
    });
  }

  kde.kernel = function(x) {
    if (!arguments.length) return kernel;
    kernel = x;
    return kde;
  };

  kde.sample = function(x) {
    if (!arguments.length) return sample;
    sample = x;
    return kde;
  };

  kde.bandwidth = function(x) {
    if (!arguments.length) return bandwidth;
    bandwidth = d3.functor(x);
    return kde;
  };

  return kde;
};
d3.stats.iqr = function(x) {
  var quartiles = d3.stats.quantiles(x, [.25, .75]);
  return quartiles[1] - quartiles[0];
};
// Welford's algorithm.
d3.stats.mean = function(x) {
  var n = x.length;
  if (n === 0) return NaN;
  var m = 0,
      i = -1;
  while (++i < n) m += (x[i] - m) / (i + 1);
  return m;
};
d3.stats.median = function(x) {
  return d3.stats.quantiles(x, [.5])[0];
};
d3.stats.mode = function(x) {
  x = x.slice().sort(d3.ascending);
  var mode,
      n = x.length,
      i = -1,
      l = i,
      last = null,
      max = 0,
      tmp,
      v;
  while (++i < n) {
    if ((v = x[i]) !== last) {
      if ((tmp = i - l) > max) {
        max = tmp;
        mode = last;
      }
      last = v;
      l = i;
    }
  }
  return mode;
};
// Uses R's quantile algorithm type=7.
d3.stats.quantiles = function(d, quantiles) {
  d = d.slice().sort(d3.ascending);
  var n_1 = d.length - 1;
  return quantiles.map(function(q) {
    if (q === 0) return d[0];
    else if (q === 1) return d[n_1];

    var index = 1 + q * n_1,
        lo = Math.floor(index),
        h = index - lo,
        a = d[lo - 1];

    return h === 0 ? a : a + h * (d[lo] - a);
  });
};
// Unbiased estimate of a sample's variance.
// Also known as the sample variance, where the denominator is n - 1.
d3.stats.variance = function(x) {
  var n = x.length;
  if (n < 1) return NaN;
  if (n === 1) return 0;
  var mean = d3.stats.mean(x),
      i = -1,
      s = 0;
  while (++i < n) {
    var v = x[i] - mean;
    s += v * v;
  }
  return s / (n - 1);
};
})()