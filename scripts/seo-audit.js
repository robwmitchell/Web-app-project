#!/usr/bin/env node

// SEO Audit Script for Stack Status IO
// Run with: npm run seo:audit

import { promises as fs } from 'fs';
import path from 'path';

class ServerSideAuditor {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };
  }

  async runAudit() {
    console.log('🔍 Starting Server-Side SEO Audit...\n');
    
    await this.checkFiles();
    await this.checkSitemap();
    await this.checkRobots();
    await this.checkManifest();
    await this.checkHTML();
    
    this.calculateScore();
    this.displayResults();
  }

  async checkFiles() {
    const requiredFiles = [
      'public/sitemap.xml',
      'public/robots.txt',
      'public/manifest.json',
      'public/_headers',
      'public/404.html',
      'src/utils/seo.js'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(file);
        this.results.passed.push(`✅ ${file} exists`);
      } catch {
        this.results.failed.push(`❌ ${file} missing`);
      }
    }
  }

  async checkSitemap() {
    try {
      const sitemap = await fs.readFile('public/sitemap.xml', 'utf8');
      
      if (sitemap.includes('https://stack-status.io')) {
        this.results.passed.push('✅ Sitemap uses HTTPS URLs');
      } else {
        this.results.failed.push('❌ Sitemap not using HTTPS URLs');
      }

      const urlCount = (sitemap.match(/<url>/g) || []).length;
      if (urlCount > 0) {
        this.results.passed.push(`✅ Sitemap has ${urlCount} URLs`);
      } else {
        this.results.failed.push('❌ Sitemap has no URLs');
      }
    } catch (error) {
      this.results.failed.push('❌ Cannot read sitemap.xml');
    }
  }

  async checkRobots() {
    try {
      const robots = await fs.readFile('public/robots.txt', 'utf8');
      
      if (robots.includes('Sitemap:')) {
        this.results.passed.push('✅ Robots.txt includes sitemap');
      } else {
        this.results.failed.push('❌ Robots.txt missing sitemap reference');
      }

      if (robots.includes('User-agent:')) {
        this.results.passed.push('✅ Robots.txt has user-agent directives');
      } else {
        this.results.failed.push('❌ Robots.txt missing user-agent directives');
      }
    } catch (error) {
      this.results.failed.push('❌ Cannot read robots.txt');
    }
  }

  async checkManifest() {
    try {
      const manifest = await fs.readFile('public/manifest.json', 'utf8');
      const data = JSON.parse(manifest);
      
      const requiredFields = ['name', 'short_name', 'description', 'icons', 'theme_color'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length === 0) {
        this.results.passed.push('✅ Manifest.json has all required fields');
      } else {
        this.results.failed.push(`❌ Manifest.json missing: ${missingFields.join(', ')}`);
      }
    } catch (error) {
      this.results.failed.push('❌ Cannot read or parse manifest.json');
    }
  }

  async checkHTML() {
    try {
      const html = await fs.readFile('index.html', 'utf8');
      
      // Check for essential meta tags
      const requiredMeta = [
        'meta charset=',
        'meta name="viewport"',
        'meta name="description"',
        'meta property="og:title"',
        'meta property="og:description"',
        'link rel="canonical"'
      ];

      for (const meta of requiredMeta) {
        if (html.includes(meta)) {
          this.results.passed.push(`✅ ${meta} found in HTML`);
        } else {
          this.results.failed.push(`❌ ${meta} missing from HTML`);
        }
      }

      // Check for structured data
      if (html.includes('application/ld+json')) {
        this.results.passed.push('✅ Structured data found in HTML');
      } else {
        this.results.failed.push('❌ No structured data in HTML');
      }

      // Check for analytics
      if (html.includes('gtag') || html.includes('google-analytics')) {
        this.results.passed.push('✅ Analytics code found');
      } else {
        this.results.warnings.push('⚠️ No analytics code detected');
      }

    } catch (error) {
      this.results.failed.push('❌ Cannot read index.html');
    }
  }

  calculateScore() {
    const total = this.results.passed.length + this.results.failed.length;
    this.results.score = total > 0 ? Math.round((this.results.passed.length / total) * 100) : 0;
  }

  displayResults() {
    console.log('📊 SEO AUDIT RESULTS');
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
    
    console.log(`🎯 OVERALL SEO SCORE: ${this.results.score}/100`);
    console.log('==========================================\n');
    
    if (this.results.score >= 90) {
      console.log('🎉 Excellent SEO implementation!');
    } else if (this.results.score >= 70) {
      console.log('👍 Good SEO, room for improvement');
    } else {
      console.log('⚠️ SEO needs significant improvement');
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Set up Google Analytics (replace G-XXXXXXXXXX with real ID)');
    console.log('   2. Submit sitemap to Google Search Console');
    console.log('   3. Monitor Core Web Vitals performance');
    console.log('   4. Create service-specific content');
    console.log('   5. Implement advanced structured data');
  }
}

// Run the audit
const auditor = new ServerSideAuditor();
auditor.runAudit();
