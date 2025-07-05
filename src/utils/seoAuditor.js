// SEO Audit Utility for Stack Status IO
// Run this to check current SEO implementation status

class SEOAuditor {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      recommendations: []
    };
  }

  // Run complete SEO audit
  async runAudit() {
    console.log('🔍 Starting SEO Audit for Stack Status IO...\n');
    
    this.checkBasicMeta();
    this.checkStructuredData();
    this.checkPerformance();
    this.checkAccessibility();
    this.checkTechnicalSEO();
    this.checkContent();
    this.checkSocialMedia();
    
    this.displayResults();
    return this.results;
  }

  // Check basic meta tags
  checkBasicMeta() {
    const title = document.querySelector('title');
    const description = document.querySelector('meta[name="description"]');
    const keywords = document.querySelector('meta[name="keywords"]');
    const canonical = document.querySelector('link[rel="canonical"]');
    const viewport = document.querySelector('meta[name="viewport"]');

    if (title && title.textContent.length > 0 && title.textContent.length <= 60) {
      this.results.passed.push('✅ Title tag exists and is optimal length');
    } else {
      this.results.failed.push('❌ Title tag missing or incorrect length');
    }

    if (description && description.content.length > 0 && description.content.length <= 160) {
      this.results.passed.push('✅ Meta description exists and is optimal length');
    } else {
      this.results.failed.push('❌ Meta description missing or too long');
    }

    if (keywords && keywords.content.length > 0) {
      this.results.passed.push('✅ Meta keywords present');
    } else {
      this.results.warnings.push('⚠️ Meta keywords missing (not critical)');
    }

    if (canonical && canonical.href) {
      this.results.passed.push('✅ Canonical URL is set');
    } else {
      this.results.failed.push('❌ Canonical URL missing');
    }

    if (viewport && viewport.content.includes('width=device-width')) {
      this.results.passed.push('✅ Responsive viewport meta tag');
    } else {
      this.results.failed.push('❌ Viewport meta tag missing or incorrect');
    }
  }

  // Check structured data
  checkStructuredData() {
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    
    if (structuredData.length > 0) {
      this.results.passed.push(`✅ ${structuredData.length} structured data block(s) found`);
      
      structuredData.forEach((script, index) => {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@context'] && data['@type']) {
            this.results.passed.push(`✅ Valid structured data #${index + 1}: ${data['@type']}`);
          }
        } catch (error) {
          this.results.failed.push(`❌ Invalid JSON in structured data #${index + 1}`);
        }
      });
    } else {
      this.results.failed.push('❌ No structured data found');
    }
  }

  // Check performance metrics
  checkPerformance() {
    const preconnects = document.querySelectorAll('link[rel="preconnect"]');
    const preloads = document.querySelectorAll('link[rel="preload"]');
    const images = document.querySelectorAll('img');

    if (preconnects.length > 0) {
      this.results.passed.push(`✅ ${preconnects.length} preconnect link(s) for performance`);
    } else {
      this.results.warnings.push('⚠️ No preconnect links found');
    }

    if (preloads.length > 0) {
      this.results.passed.push(`✅ ${preloads.length} preload link(s) for critical resources`);
    } else {
      this.results.warnings.push('⚠️ No preload links found');
    }

    // Check image optimization
    let optimizedImages = 0;
    images.forEach(img => {
      if (img.loading === 'lazy' || img.hasAttribute('loading')) {
        optimizedImages++;
      }
      if (!img.alt) {
        this.results.failed.push(`❌ Image missing alt text: ${img.src}`);
      }
    });

    if (optimizedImages > 0) {
      this.results.passed.push(`✅ ${optimizedImages} images have lazy loading`);
    }
  }

  // Check accessibility
  checkAccessibility() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1s = document.querySelectorAll('h1');
    const links = document.querySelectorAll('a');
    const buttons = document.querySelectorAll('button');

    if (h1s.length === 1) {
      this.results.passed.push('✅ Exactly one H1 tag found');
    } else if (h1s.length === 0) {
      this.results.failed.push('❌ No H1 tag found');
    } else {
      this.results.failed.push(`❌ Multiple H1 tags found (${h1s.length})`);
    }

    if (headings.length > 1) {
      this.results.passed.push(`✅ Good heading structure with ${headings.length} headings`);
    }

    // Check for empty links
    let emptyLinks = 0;
    links.forEach(link => {
      if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
        emptyLinks++;
      }
    });

    if (emptyLinks === 0) {
      this.results.passed.push('✅ All links have descriptive text');
    } else {
      this.results.failed.push(`❌ ${emptyLinks} links missing descriptive text`);
    }
  }

  // Check technical SEO
  checkTechnicalSEO() {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const lang = document.documentElement.lang;
    const favicon = document.querySelector('link[rel="icon"]');

    if (robotsMeta) {
      this.results.passed.push(`✅ Robots meta tag: ${robotsMeta.content}`);
    } else {
      this.results.warnings.push('⚠️ No robots meta tag (using default)');
    }

    if (lang) {
      this.results.passed.push(`✅ Language declared: ${lang}`);
    } else {
      this.results.failed.push('❌ No language declared in HTML tag');
    }

    if (favicon) {
      this.results.passed.push('✅ Favicon present');
    } else {
      this.results.failed.push('❌ No favicon found');
    }

    // Check HTTPS
    if (location.protocol === 'https:') {
      this.results.passed.push('✅ HTTPS enabled');
    } else {
      this.results.failed.push('❌ Not using HTTPS');
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        if (registrations.length > 0) {
          this.results.passed.push('✅ Service Worker registered');
        } else {
          this.results.warnings.push('⚠️ No Service Worker found');
        }
      });
    }
  }

  // Check content quality
  checkContent() {
    const textContent = document.body.textContent;
    const wordCount = textContent.split(/\s+/).length;
    const readabilityScore = this.calculateReadabilityScore(textContent);

    if (wordCount > 300) {
      this.results.passed.push(`✅ Sufficient content: ${wordCount} words`);
    } else {
      this.results.warnings.push(`⚠️ Low content: only ${wordCount} words`);
    }

    if (readabilityScore > 60) {
      this.results.passed.push(`✅ Good readability score: ${readabilityScore}`);
    } else {
      this.results.warnings.push(`⚠️ Readability could be improved: ${readabilityScore}`);
    }
  }

  // Check social media meta tags
  checkSocialMedia() {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterCard = document.querySelector('meta[name="twitter:card"]');

    if (ogTitle && ogDescription && ogImage && ogUrl) {
      this.results.passed.push('✅ Complete Open Graph meta tags');
    } else {
      this.results.failed.push('❌ Incomplete Open Graph meta tags');
    }

    if (twitterCard) {
      this.results.passed.push('✅ Twitter Card meta tags present');
    } else {
      this.results.warnings.push('⚠️ Twitter Card meta tags missing');
    }
  }

  // Simple readability calculation (Flesch Reading Ease approximation)
  calculateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    return Math.max(0, 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord));
  }

  // Count syllables in text (approximation)
  countSyllables(text) {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]{2,}/g, 'a')
      .replace(/[^aeiou]/g, '')
      .length || 1;
  }

  // Display audit results
  displayResults() {
    console.log('\n📊 SEO AUDIT RESULTS\n');
    console.log('==========================================\n');
    
    if (this.results.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.results.passed.forEach(item => console.log(`   ${item}`));
      console.log('');
    }
    
    if (this.results.failed.length > 0) {
      console.log('❌ FAILED CHECKS:');
      this.results.failed.forEach(item => console.log(`   ${item}`));
      console.log('');
    }
    
    if (this.results.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.results.warnings.forEach(item => console.log(`   ${item}`));
      console.log('');
    }
    
    const totalChecks = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
    const score = Math.round((this.results.passed.length / totalChecks) * 100);
    
    console.log(`🎯 OVERALL SEO SCORE: ${score}/100`);
    console.log('==========================================\n');
    
    if (score >= 90) {
      console.log('🎉 Excellent SEO implementation!');
    } else if (score >= 70) {
      console.log('👍 Good SEO, room for improvement');
    } else {
      console.log('⚠️ SEO needs significant improvement');
    }

    this.generateRecommendations();
  }

  // Generate specific recommendations
  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (this.results.failed.length > 0) {
      console.log('🔧 Priority Fixes:');
      this.results.failed.forEach(item => {
        const fix = this.getRecommendationForFailure(item);
        console.log(`   ${fix}`);
      });
      console.log('');
    }
    
    console.log('🚀 Additional Improvements:');
    console.log('   • Set up Google Analytics and Search Console');
    console.log('   • Implement Core Web Vitals monitoring');
    console.log('   • Add more comprehensive structured data');
    console.log('   • Create service-specific landing pages');
    console.log('   • Implement advanced caching strategies');
    console.log('   • Add social sharing functionality');
  }

  getRecommendationForFailure(failure) {
    const recommendations = {
      'Title tag': 'Add a title tag 50-60 characters long',
      'Meta description': 'Add meta description 150-160 characters long',
      'Canonical URL': 'Add <link rel="canonical" href="..."> to head',
      'Viewport': 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      'structured data': 'Add JSON-LD structured data for WebApplication schema',
      'H1 tag': 'Add exactly one H1 tag per page',
      'HTTPS': 'Enable HTTPS for security and SEO',
      'language': 'Add lang attribute to HTML tag',
      'favicon': 'Add favicon with <link rel="icon" href="...">',
      'Open Graph': 'Add og:title, og:description, og:image, og:url meta tags'
    };
    
    for (const [key, recommendation] of Object.entries(recommendations)) {
      if (failure.toLowerCase().includes(key.toLowerCase())) {
        return recommendation;
      }
    }
    
    return 'Check SEO documentation for specific fix';
  }
}

// Usage: Run in browser console
// const auditor = new SEOAuditor();
// auditor.runAudit();

export default SEOAuditor;
