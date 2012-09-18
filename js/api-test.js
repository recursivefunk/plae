var jasmineEnv = jasmine.getEnv();
jasmineEnv.updateInterval = 1000;

var htmlReporter = new jasmine.HtmlReporter();

jasmineEnv.addReporter(htmlReporter);

jasmineEnv.specFilter = function(spec) {
  return htmlReporter.specFilter(spec);
};

var currentWindowOnload = window.onload;

window.onload = function() {
  if (currentWindowOnload) {
    currentWindowOnload();
  }
  execJasmine();
};

function execJasmine() {
  jasmineEnv.execute();
}

document.addEventListener('message', function (e) {
  console.log(e.domain + ' said ' + e.data);
});

// describe('the test', function (){
//   console.log(window.parent)
//   it('is true', function (){
//     expect(true).toBe(true);
//   });
// });