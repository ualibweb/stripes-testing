const Nightmare = require('nightmare')
const assert = require('assert')
const config = require('../folio-ui.config.js')

describe('Using the App FOLIO UI App /scan', function () {
  this.timeout('20s')

  describe('Login, update checkout settings, checkout item to a user, check user history for item', () => {
    nightmare = new Nightmare(config.nightmare)

    var ts = new Date().valueOf()
    var scan_user = 'homer' + ts
    var barcode = '22169083'
    var select_set_scan = 'a[href="/settings/scan"]'
    var select_set_scan_check = 'a[href="/settings/scan/checkout"]'

    it('should login as ' + config.username + '/' + config.password, done => {
      nightmare
      .goto(config.url)
      .type(config.select.username, config.username)
      .type(config.select.password, config.password)
      .click(config.select.submit)
      .wait(config.select.settings)
      .then(result => { done() })
      .catch(done)
    })
    it('should set patron scan ID to "User"', done => {
      nightmare
      .click(config.select.settings)
      .wait(select_set_scan)
      .click(select_set_scan)
      .wait(select_set_scan_check)
      .click(select_set_scan_check)
      .wait('#patronScanId')
      .wait(222)
      .select('#patronScanId','USER')
      .then(result => { done() })
      .catch(done)
    })
    it('should create a user with id ' + scan_user, done => {
      nightmare
      .wait('a[Title=Users]')
      .click('a[Title=Users]')
      .wait('.button---2NsdC')
      .click('.button---2NsdC')
      .type('#adduser_username',scan_user)
      .type('#pw','lardlad')
      .click('#useractiveYesRB')
      .type('#adduser_firstname','Homer')
      .type('#adduser_lastname','Simpson')
      .type('#adduser_email', scan_user + '@folio.org')
      .type('#adduser_dateofbirth','1980-05-05')
      .select('#adduser_group','c847c5ca-ac15-42e6-9841-95ff70db86a9')
      .type('#adduser_enrollmentdate','2017-01-01')
      .type('#adduser_expirationdate','2020-01-01')
      .type('#adduser_barcode',ts)
      .click('button[title="Create New User"]')
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .then(result => { done() })
      .catch(done)
    })
    it('should check out ' + barcode + ' to ' + scan_user, done => {
      nightmare
      .wait('a[title=Scan]')
      .click('a[title=Scan]')
      .wait('#patron_identifier')
      .type('#patron_identifier',scan_user)
      .click('.pane---CC1ap:nth-of-type(1) button')
      .wait('tr[data-row]')
      .type('#barcode',barcode)
      .click('.pane---CC1ap:nth-of-type(2) button')
      .wait('.pane---CC1ap:nth-of-type(2) tr[data-row]')
      .wait(222)
      .click('form > div > button')
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .then(result => { done() })
      .catch(done)
    })
    it('should find ' + barcode + ' in ' + scan_user + ' history', done => {
      nightmare
      .click('a[title=Users]')
      .wait('.headerSearchInput---1z5qG')
      .type('.headerSearchInput---1z5qG',scan_user)
      .wait(999)
      .click('tr[data-row="0"] > td')
      .wait('.pane---CC1ap:nth-of-type(3) > div:nth-of-type(2)')
      .click('.pane---CC1ap:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(4) .col-xs-5 button')
      .wait(function(bc) {
        var xp = document.evaluate( '//td[.="' + bc + '"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
	try { 
	  var val = xp.singleNodeValue.innerHTML
	  return true
	} catch(e) {
	  return false
        }
      }, barcode)
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .then(result => { done() })
      .catch(done)
    })
    it('should check ' + barcode + ' in', done => {
      nightmare
      .click('a[title=Scan]')
      .wait('select')
      .select('select','CheckIn')
      .wait(222)
      .type('#barcode',barcode)
      .wait(222)
      .click('#ModuleContainer button')
      .wait('tr[data-row]')
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .then(result => { done() })
      .catch(done)
    })
    it('should confirm that ' + barcode + ' is removed from ' + scan_user + ' history', done => {
      nightmare
      .click('a[title=Users]')
      .wait('.headerSearchInput---1z5qG')
      .type('.headerSearchInput---1z5qG',scan_user)
      .wait(999)
      .click('tr[data-row="0"] > td')
      .wait('.pane---CC1ap:nth-of-type(3) > div:nth-of-type(2)')
      .click('.pane---CC1ap:nth-of-type(3) > div:nth-of-type(2) > div:nth-of-type(4) .col-xs-5 button')
      .wait(function(bc) {
        var xp = document.evaluate( '//td[.="' + bc + '"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
	try { 
	  var val = xp.singleNodeValue.innerHTML
	  return false 
	} catch(e) {
	  return true
        }
      }, barcode)
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .then(result => { done() })
      .catch(done)
    })
    it('should logout', done => {
      nightmare
      .click('#button-logout')
      .wait(parseInt(process.env.FOLIO_UI_DEBUG) ? parseInt(config.debug_sleep) : 0) // debugging
      .end()
      .then(result => { done() })
      .catch(done)
    })
  })
})
