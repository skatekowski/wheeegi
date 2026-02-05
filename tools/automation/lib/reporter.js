/**
 * WHEEE Standard Reporter Utility
 */
const reporter = {
  header: (title) => console.log(`\n🩺 WHEEE: ${title}\n`),
  
  pass: (msg) => console.log(` ✅ ${msg}`),
  warn: (msg) => console.log(` ⚠️  ${msg}`),
  fail: (msg) => console.log(` ❌ ${msg}`),
  info: (msg) => console.log(` ⏺ ${msg}`),
  
  section: (name) => console.log(`\n📂 ${name}`),
  
  summary: (results) => {
    console.log(`\n--- Audit Summary ---`);
    console.log(`Passed: ${results.pass}`);
    console.log(`Warnings: ${results.warn}`);
    console.log(`Failures: ${results.fail}`);
    
    if (results.fail > 0) {
      console.log('\n🔴 Critical compliance issues found.');
    } else if (results.warn > 0) {
      console.log('\n🟡 Healthy but room for improvement.');
    } else {
      console.log('\n🟢 Perfect health!');
    }
  }
};

module.exports = reporter;
