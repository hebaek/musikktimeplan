'use strict';



/****************************************************************/
//
//  Timeplan
//
/****************************************************************/

var Timeplan = (function () {
    var use = {
        'datafile':   true,
        'timeplan':   true,
        'view':       true,
        'modify':     true,
        'markup':     true,
        'hover':      true,
        'filter':     true,
        'status':     true,
        'filestatus': true,
        'info':       true,
    }



    var timeplan = {
        'error': () => { console.log('UNDEFINED FUNCTION: error()'); },
        'bool':  () => { console.log('UNDEFINED FUNCTION: bool()');  },
        'data':  () => { console.log('UNDEFINED FUNCTION: data()');  },
        'view':  () => { console.log('UNDEFINED FUNCTION: view()');  },
        'event': () => { console.log('UNDEFINED FUNCTION: event()'); },
        'html':  () => { console.log('UNDEFINED FUNCTION: html()');  },
        'file':  () => { console.log('UNDEFINED FUNCTION: file()');  },
    }



    var filedata = {
        'errors':          null,
        'warnings':        null,

        'exceldata':       null,

        'romdata':         null,
        'lærerdata':       null,
        'fagressurser':    null,
        'tilgjengelighet': null,
        'elevdata':        null,
        'gruppedata':      null,
        'fagtimer':        null,
    }



    timeplan.error = (function (type, section, key, value, data) {
        var self = {
            'type':    type,
            'section': section,
            'key':     key,
            'value':   value,
            'data':    data,
        }

        return self;
    });



    timeplan.bool = (function () {
        return {
            'union':        function (a, b) { return new Set([...a, ...b]);                  },
            'intersection': function (a, b) { return new Set([...a].filter(x => b.has(x)));  },
            'difference':   function (a, b) { return new Set([...a].filter(x => !b.has(x))); },
        }
    })();



    timeplan.data = (function () {
        var self = {
            // PRIVATE:
            'compile':  () => { console.log('UNDEFINED FUNCTION: data.compile()');  },
            'validate': () => { console.log('UNDEFINED FUNCTION: data.validate()'); },

            // PUBLIC:
            'reset':    () => { console.log('UNDEFINED FUNCTION: data.reset()');    },
            'load':     () => { console.log('UNDEFINED FUNCTION: data.load()');     },
            'modify':   () => { console.log('UNDEFINED FUNCTION: data.modify()');   },
            'save':     () => { console.log('UNDEFINED FUNCTION: data.save()');     },
            'publish':  () => { console.log('UNDEFINED FUNCTION: data.publish()');  },
        }



        self.reset = function () {
            filedata.errors             = new Set()
            filedata.warnings           = new Set()

            filedata.exceldata          = new Map()

            filedata.romdata            = new Map()
            filedata.lærerdata          = new Map()
            filedata.fagressurser       = new Map()
            filedata.tilgjengelighet    = new Map()
            filedata.elevdata           = new Map()
            filedata.gruppedata         = new Map()
            filedata.fagtimer           = new Map()
        }



        if (use.datafile) self.load = function (e) {
            var reader = new FileReader();



            reader.onload = async function (fil) {
                filedata = await file.load(fil.target.result)

                self.compile();
                self.validate();
                timeplan.view.load();
                timeplan.event.load();

                var html = "                <input id='fil' type='file' name='fil[]' />"; // HACK! Gjør at man man laste fil med samme filnavn flere ganger etter hverandre.
                $('#fil').replaceWith(html);                                              // HACK!
                $('#fil').blur();
                    
            }



            var fil = e.target.files[0];
            reader.readAsArrayBuffer(fil);
        }



        if (use.datafile) self.save    = function () { file.save(filedata)    }
        if (use.datafile) self.publish = function () { file.publish(filedata) }



        if (use.datafile) self.compile = function () {
            for (var [navn, elev] of filedata.elevdata) {
                var trinn           = null;
                var klasse          = elev.get('klasse'         );
                var teori           = elev.get('teori'          );
                var norsk           = elev.get('norsk'          );
//              var sjanger         = elev.get('sjanger'        );
//              var samspill        = elev.get('samspill'       );
                var hovedinstrument = elev.get('hovedinstrument');
//              var biinstrument1   = elev.get('biinstrument 1' );
//              var biinstrument2   = elev.get('biinstrument 2' );
                var valgfag1        = elev.get('valgfag 1'      );
                var valgfag2        = elev.get('valgfag 2'      );
                var valgfag3        = elev.get('valgfag 3'      );
                var ekstragrupper   = elev.get('ekstragrupper'  );

                if (klasse) { trinn = 'Vg' + klasse.substr(0, 1); elev.set('trinn', trinn); }

                var gruppeliste = new Set();

                if (navn)                               { gruppeliste.add(['Alle',                        []               ]); }
                if (klasse)                             { gruppeliste.add([klasse,                        ['Alle']         ]); }
                if (klasse && norsk)                    { gruppeliste.add([klasse + '-N' + norsk,         ['Alle', klasse] ]); }
                if (trinn === 'Vg1')                    { gruppeliste.add([trinn,                         ['Alle']         ]); }
                if (trinn === 'Vg2' || trinn === 'Vg3') { gruppeliste.add([trinn,                         ['Alle', 'Vg2+3']]); }
                if (trinn === 'Vg2' || trinn === 'Vg3') { gruppeliste.add(['Vg2+3',                       ['Alle']         ]); }
                if (trinn && teori)                     { gruppeliste.add([trinn + '-T' + teori,          ['Alle', trinn]  ]); }
                if (trinn && hovedinstrument)           { gruppeliste.add([trinn + '-' + hovedinstrument, ['Alle', trinn]  ]); }
                if (trinn && valgfag1)                  { gruppeliste.add(['Vf-' + valgfag1,              ['Alle', trinn]  ]); }
                if (trinn && valgfag2)                  { gruppeliste.add(['Vf-' + valgfag2,              ['Alle', trinn]  ]); }
                if (trinn && valgfag3)                  { gruppeliste.add(['Vf-' + valgfag3,              ['Alle', trinn]  ]); }

                for (gruppe in ekstragrupper)           { gruppeliste.add([ekstragrupper[gruppe], ['Alle']]) }

                for (var [gruppe, grupper] of gruppeliste) {
                    elev.get('grupper').add(gruppe);

                    if (filedata.gruppedata.has(gruppe)) {
                        filedata.gruppedata.get(gruppe).get('grupper').add(gruppe);
                        for (id of grupper) {
                            filedata.gruppedata.get(gruppe).get('grupper').add(id);
                        }
                    }
                }

                for (var gruppe of elev.get('grupper')) {
                    if (filedata.gruppedata.has(gruppe) === true) {
                        filedata.gruppedata.get(gruppe).get('elever').add(navn);

                        for (var fagtime of filedata.gruppedata.get(gruppe).get('fagtimer')) {
                            elev.get('gruppetimer').add(fagtime);
                        }
                    }
                }
            }



            for (var [tid, data] of filedata.tilgjengelighet) {
                for (var [kode, elev] of filedata.elevdata) {
                    elev.get('tilgjengelig').set(tid, false);
                    if (data.has('gruppeliste') && data.get('gruppeliste') !== null) {
                        for (var id of data.get('gruppeliste')) { if (elev.has('grupper') && elev.get('grupper').has(id)) { elev.get('tilgjengelig').set(tid, true); } }
                    }
                }



                for (var [kode, rom] of filedata.romdata) {
                    if (data.has('romliste') && data.get('romliste') !== null) {
                        if (data.get('romliste').indexOf(kode) !== -1) { rom.get('tilgjengelig').set(tid, true);  }
                        else                                           { rom.get('tilgjengelig').set(tid, false); }
                    }
                }



                for (var [kode, lærer] of filedata.lærerdata) {
                    if (data.has('lærerliste') && data.get('lærerliste') !== null) {
                        if (data.get('lærerliste').indexOf(kode) !== -1) { lærer.get('tilgjengelig').set(tid, true);  }
                        else                                             { lærer.get('tilgjengelig').set(tid, false); }
                    }
                }
            }

            for (var [kode, gruppe] of filedata.gruppedata) {
                for (var dag of ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']) {
                    for (var dagtime of ['3', '4', '5', '6', '7', '8', '9', '10']) {
                        var tid = dag + '-' + dagtime;
                        var tilgjengelig = true;

                        for (var id of gruppe.get('elever')) {
                            var elev = filedata.elevdata.get(id);
                            if (elev.get('tilgjengelig').get(tid) === false) { tilgjengelig = false; }
                        }

                        gruppe.get('tilgjengelig').set(tid, tilgjengelig);
                    }
                }
            }



            for (var [navn, gruppe] of filedata.gruppedata) {
                var trinn = new Set();

                for (var elev of gruppe.get('elever')) {
                    trinn.add(filedata.elevdata.get(elev).get('trinn'));
                }

                if (trinn.size === 1) { gruppe.set('trinn', ...trinn); }
                if (trinn.size  >  1) { gruppe.set('trinn', 'multi'); }
                if (trinn.size  <  1) { gruppe.set('trinn', 'admin'); }
            }

            for (var [id, fagtime] of filedata.fagtimer) {
                for (var rom   of fagtime.get('romliste'))   { if (filedata.romdata.has(rom))     { filedata.romdata.get(rom).get('fagtimer').add(id);     } }
                for (var lærer of fagtime.get('lærerliste')) { if (filedata.lærerdata.has(lærer)) { filedata.lærerdata.get(lærer).get('fagtimer').add(id); } }
            }
        }



        if (use.datafile) self.validate = function () {
            var regex = { }

            regex.romdata = {
                'kode':            /^[^ ]+$/,
                'navn':            /^.+$/,
            }
            regex.lærerdata = {
                'kode':            /^[^ ]+$/,
                'fornavn':         /^.+$/,
                'mellomnavn':      /^.*$/,
                'etternavn':       /^.+$/,
            }
            regex.fagressurser = {
                'kode':            /^.+$/,
                'navn':            /^.+$/,
                'varighet':        /^[0-9][0-9.]*$/,
            }
            regex.tilgjengelighet = {
                'tid':             /^(mandag|tirsdag|onsdag|torsdag|fredag)-(3|4|5|6|7|8|9|10)$/,
                'dag':             /^mandag|tirsdag|onsdag|torsdag|fredag$/,
                'time':            /^3|4|5|6|7|8|9|10$/,
            }
            regex.elevdata = {
                'navn':            /^.+$/,
                'fornavn':         /^.+$/,
                'etternavn':       /^.+$/,
                'klasse':          /^(1|2|3)(A|B|C|D|E)$/,
                'teori':           /^null|(1|2)$/,
                'norsk':           /^null|(1|2)$/,
                'sjanger':         /^null|.*$/,
                'samspill':        /^null|.*$/,
                'hovedinstrument': /^null|.*$/,
                'biinstrument1':   /^null|.*$/,
                'biinstrument2':   /^null|.*$/,
                'valgfag1':        /^null|.*$/,
                'valgfag2':        /^null|.*$/,
                'valgfag3':        /^null|.*$/,
                'dag':             /^null|mandag|tirsdag|onsdag|torsdag|fredag$/,
                'time':            /^null|3|4|5|6|7|8|9|10$/,
            }
            regex.gruppedata = {
                'navn':            /^.+$/,
                'dag':             /^null|mandag|tirsdag|onsdag|torsdag|fredag$/,
                'time':            /^null|3|4|5|6|7|8|9|10$/,
            }



            var romset    = new Set();
            var lærerset  = new Set();
            var fagset    = new Set();
            var tidset    = new Set();
            var elevset   = new Set();
            var gruppeset = new Set();

            for (var [kode,    _] of filedata.romdata)         { romset.add(kode);    }
            for (var [kode,    _] of filedata.lærerdata)       { lærerset.add(kode);  }
            for (var [kode,    _] of filedata.fagressurser)    { fagset.add(kode);    }
            for (var [tid,     _] of filedata.tilgjengelighet) { tidset.add(tid);     }
            for (var [navn, data] of filedata.elevdata)        { elevset.add(navn);   for (var gruppe of data.get('grupper')) { gruppeset.add(gruppe); } }
            for (var [navn,    _] of filedata.gruppedata)      { gruppeset.add(navn); }

            for (var [kode, data] of filedata.romdata) {
                var errordata = []; for (var k of ['kode', 'navn']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['kode', kode],
                    ['navn', data.get('navn')],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.romdata[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'romdata', k, v, errordata)); }
                }
            }

            for (var [kode, data] of filedata.lærerdata) {
                var errordata = []; for (var k of ['kode', 'fornavn', 'mellomnavn', 'etternavn']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['kode',       kode],
                    ['fornavn',    data.get('fornavn')],
                    ['mellomnavn', data.get('mellomnavn')],
                    ['etternavn',  data.get('etternavn')],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.lærerdata[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'lærerdata', k, v, errordata)); }
                }
            }

            for (var [kode, data] of filedata.fagressurser) {
                var errordata = []; for (var k of ['kode', 'navn', 'varighet', 'romliste', 'lærerliste']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['kode',     kode],
                    ['navn',     data.get('navn')],
                    ['varighet', data.get('varighet')],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.fagressurser[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'fagressurser', k, v, errordata)); }
                }

                if (data.has('romliste') && data.get('romliste') !== null) {
                    for (var v of data.get('romliste')) {
                        if (!regex.romdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'fagressurser', 'rom', v, errordata)); }
                        if (!romset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'fagressurser', 'rom', v, errordata)); }
                    }
                }
                if (data.has('lærerliste') && data.get('lærerliste') !== null) {
                    for (var v of data.get('lærerliste')) {
                        if (!regex.lærerdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'fagressurser', 'lærer', v, errordata)); }
                        if (!lærerset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'fagressurser', 'lærer', v, errordata)); }
                    }
                }
            }

            for (var [tid, data] of filedata.tilgjengelighet) {
                var errordata = []; for (var k of ['dag', 'dagtime', 'gruppeliste', 'romliste', 'lærerliste']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['tid',  tid],
                    ['dag',  data.get('dag')],
                    ['time', data.get('dagtime')],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.tilgjengelighet[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'tilgjengelighet', k, v, errordata)); }
                }

                if (data.has('gruppeliste') && data.get('gruppeliste') !== null) {
                    for (var v of data.get('gruppeliste')) {
                        if (!regex.gruppedata.navn.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'tilgjengelighet', 'gruppe', v, errordata)); }
                        if (!gruppeset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'tilgjengelighet', 'gruppe', v, errordata)); }
                    }
                }
                if (data.has('romliste') && data.get('romliste') !== null) {
                    for (var v of data.get('romliste')) {
                        if (!regex.romdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'tilgjengelighet', 'rom', v, errordata)); }
                        if (!romset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'tilgjengelighet', 'rom', v, errordata)); }
                    }
                }
                if (data.has('lærerliste') && data.get('lærerliste') !== null) {
                    for (var v of data.get('lærerliste')) {
                        if (!regex.lærerdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'tilgjengelighet', 'lærer', v, errordata)); }
                        if (!lærerset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'tilgjengelighet', 'lærer', v, errordata)); }
                    }
                }
            }

            for (var [navn, data] of filedata.elevdata) {
                var errordata = []; for (var k of ['kode', 'fornavn', 'mellomnavn', 'etternavn', 'klasse', 'teori']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['navn',            navn],
                    ['fornavn',         data.get('fornavn')],
                    ['etternavn',       data.get('etternavn')],
                    ['klasse',          data.get('klasse')],
                    ['teori',           data.get('teori')],
                    ['norsk',           data.get('norsk')],
                    ['sjanger',         data.get('sjanger')],
                    ['samspill',        data.get('samspill')],
                    ['hovedinstrument', data.get('hovedinstrument')],
                    ['biinstrument1',   data.get('biinstrument1')],
                    ['biinstrument2',   data.get('biinstrument2')],
                    ['valgfag1',        data.get('valgfag1')],
                    ['valgfag2',        data.get('valgfag2')],
                    ['valgfag3',        data.get('valgfag3')],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.elevdata[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'elevdata', k, v, errordata)); }
                }

                for (var fid of data.get('fagtimer')) {
                    var fagtime = filedata.fagtimer.get(fid);

                    var v = fagtime.get('fag');
                    if (!regex.fagressurser.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'elevdata', 'fag', v, errordata)); }
                    if (!fagset.has(v))                   { filedata.errors.add(new timeplan.error('finnes ikke', 'elevdata', 'fag', v, errordata)); }

                    v = fagtime.get('dag');
                    if (!regex.elevdata.dag.test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'elevdata', 'dag', v, errordata)); }

                    v = fagtime.get('dagtime');
                    if (!regex.elevdata.time.test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'elevdata', 'time', v, errordata)); }

                    for (var v of fagtime.get('lærerliste')) {
                        if (!regex.lærerdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'elevdata', 'lærer', v, errordata)); }
                        if (!lærerset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'elevdata', 'lærer', v, errordata)); }
                    }
                    for (var v of fagtime.get('romliste')) {
                        if (!regex.romdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'elevdata', 'rom', v, errordata)); }
                        if (!romset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'elevdata', 'rom', v, errordata)); }
                    }
                }
            }

            for (var [navn, data] of filedata.gruppedata) {
                var errordata = []; for (var k of ['navn']) { errordata.push(data.get(k)); }

                var testdata = [
                    ['navn', navn],
                ];

                for (var [k, v] of testdata) {
                    if (!regex.gruppedata[k].test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'gruppedata', k, v, errordata)); }
                }

                for (var fid of data.get('fagtimer')) {
                    var fagtime = filedata.fagtimer.get(fid);

                    var v = fagtime.get('fag');
                    if (!regex.fagressurser.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'gruppedata', 'fag', v, errordata)); }
                    if (!fagset.has(v))                   { filedata.errors.add(new timeplan.error('finnes ikke', 'gruppedata', 'fag', v, errordata)); }

                    v = fagtime.get('dag');
                    if (!regex.elevdata.dag.test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'gruppedata', 'dag', v, errordata)); }

                    v = fagtime.get('dagtime');
                    if (!regex.elevdata.time.test(v)) { filedata.errors.add(new timeplan.error('ugyldig', 'gruppedata', 'time', v, errordata)); }

                    for (var v of fagtime.get('lærerliste')) {
                        if (!regex.lærerdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'gruppedata', 'lærer', v, errordata)); }
                        if (!lærerset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'gruppedata', 'lærer', v, errordata)); }
                    }
                    for (var v of fagtime.get('romliste')) {
                        if (!regex.romdata.kode.test(v)) { filedata.errors.add(new timeplan.error('ugyldig',     'gruppedata', 'rom', v, errordata)); }
                        if (!romset.has(v))              { filedata.errors.add(new timeplan.error('finnes ikke', 'gruppedata', 'rom', v, errordata)); }
                    }
                }
            }
        }



        if (use.modify) self.modify = function (fid, data) {
            var fagtime = filedata.fagtimer.get(fid);

            if ('tid' in data) {
                if (data.tid) {
                    var tid = data.tid.split('-');
                    fagtime.set('dag',     tid[0]);
                    fagtime.set('dagtime', tid[1]);
                } else {
                    fagtime.set('dag',     null);
                    fagtime.set('dagtime', null);
                }
            }

            if ('romliste' in data) {
                for (var rom of fagtime.get('romliste')) { filedata.romdata.get(rom).get('fagtimer').delete(fid); }
                fagtime.set('romliste', data.romliste);
                for (var rom of fagtime.get('romliste')) { filedata.romdata.get(rom).get('fagtimer').add(fid); }
            }

            if ('lærerliste' in data) {
                for (var lærer of fagtime.get('lærerliste')) { filedata.lærerdata.get(lærer).get('fagtimer').delete(fid); }
                fagtime.set('lærerliste', data.lærerliste);
                for (var lærer of fagtime.get('lærerliste')) { filedata.lærerdata.get(lærer).get('fagtimer').add(fid); }
            }
        }



        return {
            'reset':    self.reset,
            'load':     self.load,
            'modify':   self.modify,
            'save':     self.save,
            'publish':  self.publish,
        }
    })();



    timeplan.view = (function () {
        var self = {
            // PRIVATE:
            'freeze':     false,
            'filestatus': () => { console.log('UNDEFINED FUNCTION: view.filestatus()'); },
            'sort':       () => { console.log('UNDEFINED FUNCTION: view.sort()');       },
            'status':     () => { console.log('UNDEFINED FUNCTION: view.status()');     },

            // PUBLIC:
            'reset':      () => { console.log('UNDEFINED FUNCTION: view.reset()');      },
            'load':       () => { console.log('UNDEFINED FUNCTION: view.load()');       },
            'fagtime':    () => { console.log('UNDEFINED FUNCTION: view.fagtime()');    },
            'markup':     () => { console.log('UNDEFINED FUNCTION: view.markup()');     },
            'hover':      () => { console.log('UNDEFINED FUNCTION: view.hover()');      },
            'filter':     () => { console.log('UNDEFINED FUNCTION: view.filter()');     },
        }



        if (use.view) self.reset = function () {
            $('#info').html(timeplan.html.info());
        }



        if (use.filestatus) self.filestatus = function () {
            if (filedata.errors.size > 0) {
                var errordata = new Map();
                for (var error of filedata.errors) {
                    if (!errordata.has(error.type))                    { errordata.set(error.type, new Map()); }
                    if (!errordata.get(error.type).has(error.section)) { errordata.get(error.type).set(error.section, new Set()); }
                    var e = new Map([['key', error.key || ''], ['value', error.value || ''], ['data', error.data || '']]);
                    errordata.get(error.type).get(error.section).add(e);
                }



                var html = "<div id='dimscreen'></div>"
                         + "<div id='filestatus'>"
                         + "    <div id='overskrift'></div>"
                         + "</div>"
                         ;

                $('body').append(html);

                $('#overskrift').html("<div class='overskrift'>Oisann, det er alvorlige feil i fila!</div><div class='comment'>Trykk 'esc' for å lukke</div>");

                if (errordata.has('mangler')) {
                    var html = '';

                    for (var [section, _] of errordata.get('mangler')) {
                        html += "<div class='type'>Følgende data mangler i " + section + ":</div>";

                        var width = { key: 0, data: new Map() }
                        for (var error of errordata.get('mangler').get(section)) {
                            if (!error.has('key') || !error.get('key')) { error.set('key', ''); }
                            width.key = Math.max(width.key, (error.has('key') ? error.get('key').length : 0));

                            var i = 0;
                            for (var d of error.get('data')) {
                                if (!width.data.has(i)) { width.data.set(i, 0); }
                                width.data.set(i, Math.max(width.data.get(i), (d ? d.length : 0)));
                                i++;
                            }
                        }

                        for (var error of errordata.get('mangler').get(section)) {
                            var key   = ((error.get('key')   || '') + '                                        ').substr(0, width.key);   if (key.length   > 40) { key   = key.substr(0, 40)   + '...'; }
//                          var value = ((error.get('value') || '') + '                                        ').substr(0, width.value); if (value.length > 40) { value = value.substr(0, 40) + '...'; }

                            var i = 0;
                            var data  = ' | ';
                            for (var d of error.get('data')) {
                                var cell = ((d || '') + '                                        ').substr(0, width.data.get(i)); if (cell.length > 40) { cell = cell.substr(0, 40) + '...'; }
                                data += cell + ' | ';
                                i++;
                            }

                            html += "<div class='errorline'><span class='error'>" + key + " = " + value + "</span><span class='context'>     Data: " + data + "</span></div>";
                        }
                    }
                    $('#filestatus').append(html);
                }
                if (errordata.has('ugyldig')) {
                    var html = '';

                    for (var [section, _] of errordata.get('ugyldig')) {
                        html += "<div class='type'>Følgende data i " + section + " er ugyldig:</div>";

                        var width = { key: 0, data: new Map() }
                        for (var error of errordata.get('ugyldig').get(section)) {
                            width.key   = Math.max(width.key, (error.has('key')   ? error.get('key').length   : 0));
                            width.value = Math.max(width.key, (error.has('value') ? error.get('value').length : 0));

                            var i = 0;
                            for (var d of error.get('data')) {
                                if (!width.data.has(i)) { width.data.set(i, 0); }
                                width.data.set(i, Math.max(width.data.get(i), (d ? d.length : 0)));
                                i++;
                            }
                        }

                        for (var error of errordata.get('ugyldig').get(section)) {
                            var key   = ((error.get('key')   || '') + '                                        ').substr(0, width.key);   if (key.length   > 40) { key   = key.substr(0, 40)   + '...'; }
                            var value = ((error.get('value') || '') + '                                        ').substr(0, width.value); if (value.length > 40) { value = value.substr(0, 40) + '...'; }

                            var i = 0;
                            var data  = ' | ';
                            for (var d of error.get('data')) {
                                var cell = ((d || '') + '                                        ').substr(0, width.data.get(i)); if (cell.length > 40) { cell = cell.substr(0, 40) + '...'; }
                                data += cell + ' | ';
                                i++;
                            }

                            html += "<div class='errorline'><span class='error'>" + key + " = " + value + "</span><span class='context'>     Data: " + data + "</span></div>";
                        }
                    }
                    $('#filestatus').append(html);
                }
                if (errordata.has('finnes ikke')) {
                    var html = '';

                    for (var [section, _] of errordata.get('finnes ikke')) {
                        html += "<div class='type'>Følgende data i " + section + " finnes ikke:</div>";

                        var width = { key: 0, data: new Map() }
                        for (var error of errordata.get('finnes ikke').get(section)) {
                            width.key   = Math.max(width.key, (error.has('key')   ? error.get('key').length   : 0));
                            width.value = Math.max(width.key, (error.has('value') ? error.get('value').length : 0));

                            var i = 0;
                            for (var d of error.get('data')) {
                                if (!width.data.has(i)) { width.data.set(i, 0); }
                                width.data.set(i, Math.max(width.data.get(i), (d ? d.length : 0)));
                                i++;
                            }
                        }

                        for (var error of errordata.get('finnes ikke').get(section)) {
                            var key   = ((error.get('key')   || '') + '                                        ').substr(0, width.key);   if (key.length   > 40) { key   = key.substr(0, 40)   + '...'; }
                            var value = ((error.get('value') || '') + '                                        ').substr(0, width.value); if (value.length > 40) { value = value.substr(0, 40) + '...'; }

                            var i = 0;
                            var data  = ' | ';
                            for (var d of error.get('data')) {
                                var cell = ((d || '') + '                                        ').substr(0, width.data.get(i)); if (cell.length > 40) { cell = cell.substr(0, 40) + '...'; }
                                data += cell + ' | ';
                                i++;
                            }

                            html += "<div class='errorline'><span class='error'>" + key + " = " + value + "</span><span class='context'>     Data: " + data + "</span></div>";
                        }
                    }
                    $('#filestatus').append(html);
                }

                timeplan.data.reset();
                self.reset();
            }



            var removefilestatus = function (e) {
                if (e.keyCode == 27) {
                    $('#dimscreen').remove();
                    $('#filestatus').remove();                
                } else {
                    $(document).one('keypress', removefilestatus)
                }
            }

            $(document).one('keypress', removefilestatus)
        }



        if (use.view) self.load = function () {
            self.reset();
            $('#timeplan').html(timeplan.html.load());
            $('#info').hide();
            if (use.filestatus) self.filestatus();

            var romliste = [...filedata.romdata].sort();
            var html = '';
            for (var [_, rom] of romliste) {
                html += "<div class='rom'>"
                     +  "<span class='kode'>"      + rom.get('kode') + "</span>"
                     +  "<span class='romnummer'>" + rom.get('navn') + "</span>"
                     +  "</div>"
                     ;
            }

            $('#timeplan .tilgjengeligerom').html(html);
            $('#pool .tilgjengeligerom').html(html);


            self.freeze = true;
            for (var [id, fagtime] of filedata.fagtimer) {
                self.fagtime(fagtime);
            }
            self.freeze = false;

            self.sort('alle');
            if (use.markup) self.markup('alle');
            if (use.status) self.status();



            if (use.filter) {
                var options = new Set();
                options.add("<option value='Vg1'>Vg1</option>");
                options.add("<option value='Vg2'>Vg2</option>");
                options.add("<option value='Vg3'>Vg3</option>");

                for (var [navn, gruppe] of filedata.gruppedata) {
                    options.add("<option value='" + navn + "'>" + gruppe.get('navn') + "</option>");
                }

                var html = '';
                for (var option of [...options].sort()) { html += option; }
                $('#filtergruppe').html(html);



                var options = new Set();
                for (var [kode, fag] of filedata.fagressurser) {
                    options.add("<option value='" + kode + "'>" + fag.get('navn') + "</option>");
                }

                var html = "<option value='alle' selected='selected'>Alle</option>";
                for (var option of [...options].sort()) { html += option; }
                $('#filterfag').html(html);



                var options = new Set();
                for (var [kode, lærer] of filedata.lærerdata) {
                    options.add("<option value='" + kode + "'>" + lærer.get('navn') + "</option>");
                }
                var html = "<option value='alle' selected='selected'>Alle</option>";
                for (var option of [...options].sort()) { html += option; }
                $('#filterlærer').html(html);
            }
        }



        if (use.view) self.fagtime = function (fagtime, gammeltid) {
            var dag     = fagtime.get('dag');
            var dagtime = fagtime.get('dagtime');

            var fid        = fagtime.get('id');
            var type       = fagtime.get('type');
            var navn       = fagtime.get('navn');
            var fag        = fagtime.get('fag');
            var lærerliste = fagtime.get('lærerliste');
            var romliste   = fagtime.get('romliste');
            var varighet   = filedata.fagressurser.get(fag).get('varighet')
            var tidset     = new Set()
            var antall     = null

            var rom   = ''; if (romliste.length   === 0) { rom   = '---'; } else if (romliste.length   === 1) { rom   = romliste[0];   } else { rom   = '(+)'; }
            var lærer = ''; if (lærerliste.length === 0) { lærer = '---'; } else if (lærerliste.length === 1) { lærer = lærerliste[0]; } else { lærer = '(+)'; }

            var romhtml   = ''; for (var kode of romliste)   { romhtml   += "<div class='kode'>" + kode + "</div>"; }
            var lærerhtml = ''; for (var kode of lærerliste) { lærerhtml += "<div class='kode'>" + kode + "</div>"; }

            if (type == 'gruppe') {
                antall = filedata.gruppedata.get(navn).get('elever').size
            }

            $('.' + fid).remove();

            if (dag && dagtime) {
                if (varighet > 0) {
                    var html = "<div class='fagtime " + fid + "' id='" + fid + "'>"
                             + "<div class='rom'>"    + rom    + romhtml   + "</div>"
                             + "<div class='lærer'>"  + lærer  + lærerhtml + "</div>"
                             + "<div class='fag'>"    + fag    + "</div>"
                             + (antall ? "<div class='antall'>" + antall + "</div>" : "")
                             + "<div class='navn'>"   + navn   + "</div>"
                             + "</div>"
                             ;

                    var tid = dag + '-' + dagtime;
                    tidset.add(tid)
                    $('#' + tid + ' .fagtimer').append(html);
                }

                if (varighet > 45) {
                    var html = "<div class='fagtime fortsettelse " + fid + "' id='" + fid + "-1'>"
                             + "<div class='rom'>"   + rom   + romhtml   + "</div>"
                             + "<div class='lærer'>" + lærer + lærerhtml + "</div>"
                             + "<div class='fag'>"   + fag   + "</div>"
                             + (antall ? "<div class='antall'>" + antall + "</div>" : "")
                             + "<div class='navn'>"  + navn  + "</div>"
                             + "</div>"
                             ;

                    var tid = dag + '-' + (parseInt(dagtime) + 1);
                    tidset.add(tid)
                    $('#' + tid + ' .fagtimer').append(html);
                }

                if (varighet > 90) {
                    var html = "<div class='fagtime fortsettelse " + fid + "' id='" + fid + "-2'>"
                             + "<div class='rom'>"   + rom   + romhtml   + "</div>"
                             + "<div class='lærer'>" + lærer + lærerhtml + "</div>"
                             + "<div class='fag'>"   + fag   + "</div>"
                             + (antall ? "<div class='antall'>" + antall + "</div>" : "")
                             + "<div class='navn'>"  + navn  + "</div>"
                             + "</div>"
                             ;

                    var tid = dag + '-' + (parseInt(dagtime) + 2);
                    tidset.add(tid)
                    $('#' + tid + ' .fagtimer').append(html);
                }

                if (varighet > 135) {
                    var html = "<div class='fagtime fortsettelse " + fid + "' id='" + fid + "-3'>"
                             + "<div class='rom'>"   + rom   + romhtml   + "</div>"
                             + "<div class='lærer'>" + lærer + lærerhtml + "</div>"
                             + "<div class='fag'>"   + fag   + "</div>"
                             + (antall ? "<div class='antall'>" + antall + "</div>" : "")
                             + "<div class='navn'>"  + navn  + "</div>"
                             + "</div>"
                             ;

                    var tid = dag + '-' + (parseInt(dagtime) + 3);
                    tidset.add(tid)
                    $('#' + tid + ' .fagtimer').append(html);
                }

                if (self.freeze === false) {
                    self.sort('timeplan', tidset);
                    if (use.markup) self.markup('timeplan', tidset);
                    if (use.markup) self.markup('timeplan', gammeltid);
                    if (use.status) self.status();
                }
            } else {
                var html = "<div class='fagtime " + fid + "' id='" + fid + "'>"
                         + "<div class='rom'>"   + rom   + romhtml   + "</div>"
                         + "<div class='lærer'>" + lærer + lærerhtml + "</div>"
                         + "<div class='fag'>"   + fag   + "</div>"
                             + (antall ? "<div class='antall'>" + antall + "</div>" : "")
                         + "<div class='navn'>"  + navn  + "</div>"
                         + "</div>"
                         ;

                $('#pool .fagtimecontainer').append(html);
                if (self.freeze === false) {
                    self.sort('pool');
                    if (use.markup) self.markup('timeplan', gammeltid);
                    if (use.status) self.status();
                }
            }

            timeplan.event.update();
        }



        if (use.view) self.sort = function (type, tidset) {
            if (type === 'alle') {
                tidset = new Set()
                for (var dag of ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']) {
                    for (var dagtime of ['3', '4', '5', '6', '7', '8', '9', '10']) {
                        tidset.add(dag + '-' + dagtime);
                    }
                }

                self.sort('timeplan', tidset);
                self.sort('pool');
            }

            if (type === 'pool') {
                var container = $('#pool > .fagtimecontainer');
                var fagtimer  = container.children('.fagtime');

                fagtimer.sort(function (a, b) {
                    var antallA  = 0;                             var antallB  = 0;
                    var fidA     = $(a).attr('id');               var fidB     = $(b).attr('id')
                    var fagtimeA = filedata.fagtimer.get(fidA);   var fagtimeB = filedata.fagtimer.get(fidB);
                    var typeA    = fagtimeA.get('type');          var typeB    = fagtimeB.get('type');

                    if (typeA == 'elev') { antallA = 1; }         if (typeB == 'elev') { antallB = 1; }
                    if (typeA == 'gruppe') {
                        var navn       = fagtimeA.get('navn')
                        var gruppedata = filedata.gruppedata.get(navn)
                        antallA = gruppedata.get('elever').size
                    }
                    if (typeB == 'gruppe') {
                        var navn       = fagtimeB.get('navn')
                        var gruppedata = filedata.gruppedata.get(navn)
                        antallB = gruppedata.get('elever').size
                    }

                    var romA    = $(a).children('.rom').text();   var romB    = $(b).children('.rom').text();
                    var lærerA  = $(a).children('.lærer').text(); var lærerB  = $(b).children('.lærer').text();
                    var fagA    = $(a).children('.fag').text();   var fagB    = $(b).children('.fag').text();
                    var navnA   = $(a).children('.navn').text();  var navnB   = $(b).children('.navn').text();

                    if      (antallA > antallB) { return -1; } else if (antallA < antallB) { return  1; }
                    else if (fagA    < fagB   ) { return -1; } else if (fagA    > fagB   ) { return  1; }
                    else if (lærerA  < lærerB ) { return -1; } else if (lærerA  > lærerB ) { return  1; }
                    else if (navnA   < navnB  ) { return -1; } else if (navnA   > navnB  ) { return  1; }
                    else if (romA    < romB   ) { return -1; } else if (romA    > romB   ) { return  1; }
                    else                      { return  0; }
                });
                $(container).append(fagtimer);
            }

            if (type === 'timeplan') {
                for (var tid of [...tidset]) {
                    var container = $('#' + tid + ' > .fagtimer');
                    var fagtimer  = container.children('.fagtime');
    
                    fagtimer.sort(function (a, b) {
                        var romA   = $(a).children('.rom').text();   var romB   = $(b).children('.rom').text();
                        var lærerA = $(a).children('.lærer').text(); var lærerB = $(b).children('.lærer').text();
                        var fagA   = $(a).children('.fag').text();   var fagB   = $(b).children('.fag').text();
                        var navnA  = $(a).children('.navn').text();  var navnB  = $(b).children('.navn').text();
    
                        if      (romA   < romB  ) { return -1; } else if (romA   > romB  ) { return  1; }
                        else if (lærerA < lærerB) { return -1; } else if (lærerA > lærerB) { return  1; }
                        else if (fagA   < fagB  ) { return -1; } else if (fagA   > fagB  ) { return  1; }
                        else if (navnA  < navnB ) { return -1; } else if (navnA  > navnB ) { return  1; }
                        else                      { return  0; }
                    });
                    $(container).append(fagtimer);
                }
            }
        }



        if (use.markup) self.markup = function (type, tidset) {
            if (type === 'alle') {
                tidset = new Set()
                for (var dag of ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']) {
                    for (var dagtime of ['3', '4', '5', '6', '7', '8', '9', '10']) {
                        tidset.add(dag + '-' + dagtime);
                    }
                }

                self.markup('timeplan', tidset);
            }



            if (type === 'timeplan') {
                if (!tidset) { tidset = new Set() }

                for (var tid of [...tidset]) {
                    $('#' + tid + ' .tilgjengeligerom .rom').removeClass('utilgjengelig opptatt');

                    for (var [kode, rom] of filedata.romdata) {
                        var tilgjengelig = rom.get('tilgjengelig').get(tid)
                        if (tilgjengelig === false) {
                            var objects = $('#' + tid + ' .rom').filter(function () { var result = false; $(this).children('.kode').each(function () { if ($(this).text() === kode) { result = true; } }); return result; });
                            $(objects).addClass('utilgjengelig');
                        }
                    }

                    var markupset = new Set()
                    for (var [fid, fagtime] of filedata.fagtimer) {
                        var dag      = fagtime.get('dag');
                        var dagtime  = fagtime.get('dagtime');
    
                        var fagkode  = fagtime.get('fag')
                        var varighet = filedata.fagressurser.get(fagkode).get('varighet')
    
                        for (var v of [0, 1, 2, 3]) {
                            var restvarighet = varighet - 45*v
                            if (restvarighet > 0) {
                                var t = dag + '-' + (parseInt(dagtime) + v)
                                if (tid === t) { markupset.add([fid, fagtime]) }
                            }
                        }
                    }
    
                    for (var [fid, fagtime] of markupset) {
                        var type    = fagtime.get('type');
                        var navn    = fagtime.get('navn');

/****************************************************************/
// Markup fagtime
/****************************************************************/
    
                        var fagtimer2    = null;
                        var tilgjengelig = null;
                        var varighet     = 0;
                        var classet      = new Set();
    
    
    
                        if (type === 'elev')   {
                            tilgjengelig   = filedata.elevdata.get(navn).get('tilgjengelig').get(tid);
                            var fagfids    = filedata.elevdata.get(navn).get('fagtimer');
                            var gruppefids = filedata.elevdata.get(navn).get('gruppetimer');
                            fagtimer2 = new Set([...fagfids, ...gruppefids]);
                        }
    
                        if (type === 'gruppe') {
                            tilgjengelig = filedata.gruppedata.get(navn).get('tilgjengelig').get(tid);
                            fagtimer2    = filedata.gruppedata.get(navn).get('fagtimer');
                        }
    
    
    
                        for (var fid2 of fagtimer2) {
                            var fagtime2  = filedata.fagtimer.get(fid2)
                            var fagkode2  = fagtime2.get('fag')
                            var varighet2 = filedata.fagressurser.get(fagkode2).get('varighet')
    
                            for (var v of [0, 1, 2, 3]) {
                                var restvarighet = varighet2 - 45*v
                                if (restvarighet > 0) {
                                    var t = fagtime2.get('dag') + '-' + (parseInt(fagtime2.get('dagtime')) + v)
                                    if (tid === t) { varighet += Math.min(45, restvarighet) }
                                }
                            }
                        }
    
    
    
                        if (tilgjengelig === false) { classet.add('utilgjengelig'); }
                        if (varighet > 45)          { classet.add('overbooket');    }
    
                        var classes    = [...classet].join(' ');
                        var oldclasses = ['utilgjengelig', 'overbooket'].join(' ');
    
                        var objects    = $('.' + fid);
                        $(objects).removeClass(oldclasses).addClass(classes);
    


/****************************************************************/
// Markup rom
/****************************************************************/

                        for (var kode of fagtime.get('romliste')) {
                            var classet      = new Set();

                            var fagtimer2    = filedata.romdata.get(kode).get('fagtimer');
                            var tilgjengelig = filedata.romdata.get(kode).get('tilgjengelig').get(tid);
                            var varighet     = 0;
                            var multiliste   = new Set();
    
    
                            for (var fid2 of fagtimer2) {
                                var fagtime2   = filedata.fagtimer.get(fid2)
                                var fagkode2   = fagtime2.get('fag')
                                var lærerliste = fagtime2.get('lærerliste');
                                var varighet2  = filedata.fagressurser.get(fagkode2).get('varighet')
    
                                for (var v of [0, 1, 2, 3]) {
                                    var restvarighet = varighet2 - 45*v
                                    if (restvarighet > 0) {
                                        var t = fagtime2.get('dag') + '-' + (parseInt(fagtime2.get('dagtime')) + v)
                                        if (tid === t) {
                                            varighet += Math.min(45, restvarighet)
                                            multiliste.add(fagkode2 + '-' + lærerliste.join(' '))
                                        }
                                    }
                                }
                            }

                            if (varighet >  0)          { classet.add('opptatt');       }
                            if (varighet > 45)          { classet.add('overbooket');    }
                            if (multiliste.size > 1)    { classet.add('multi');         }
    
    
    
                            var classes = [...classet].join(' ');
                            var oldclasses = ['opptatt', 'overbooket', 'multi'].join(' ');
    
                            var objects = $('#' + tid + ' .rom').filter(function () { var result = false; $(this).children('.kode').each(function () { if ($(this).text() === kode) { result = true; } }); return result; });
                            $(objects).removeClass(oldclasses).addClass(classes);
                        }
    
    
    
/****************************************************************/
// Markup lærere
/****************************************************************/
    
                        for (var kode of fagtime.get('lærerliste')) {
                            var classet      = new Set();

                            var fagtimer2    = filedata.lærerdata.get(kode).get('fagtimer');
                            var tilgjengelig = filedata.lærerdata.get(kode).get('tilgjengelig').get(tid);
                            var varighet     = 0;
                            var multiliste   = new Set();
    
    
    
                            for (var fid2 of fagtimer2) {
                                var fagtime2   = filedata.fagtimer.get(fid2)
                                var fagkode2   = fagtime2.get('fag')
                                var romliste   = fagtime2.get('romliste');
                                var varighet2  = filedata.fagressurser.get(fagkode2).get('varighet')
    
                                for (var v of [0, 1, 2, 3]) {
                                    var restvarighet = varighet2 - 45*v
                                    if (restvarighet > 0) {
                                        var t = fagtime2.get('dag') + '-' + (parseInt(fagtime2.get('dagtime')) + v)
                                        if (tid === t) {
                                            varighet += Math.min(45, restvarighet)
                                            multiliste.add(fagkode2 + '-' + romliste.join(' '))
                                        }
                                    }
                                }
                            }
    
                            if (tilgjengelig === false) { classet.add('utilgjengelig'); }
                            if (varighet >  0)          { classet.add('opptatt');       }
                            if (varighet > 45)          { classet.add('overbooket');    }
                            if (multiliste.size > 1)    { classet.add('multi');         }
    
    
    
                            var classes = [...classet].join(' ');
                            var oldclasses = ['utilgjengelig', 'opptatt', 'overbooket', 'multi'].join(' ');
    
                            var objects = $('#' + tid + ' .lærer').filter(function () { var result = false; $(this).children('.kode').each(function () { if ($(this).text() === kode) { result = true; } }); return result; }).addClass(classes);
                            $(objects).removeClass(oldclasses).addClass(classes);
                        }
                    }
                }
            }
        }



        if (use.status) self.status = function () {
            var data = new Set();

            var totalt      = filedata.fagtimer.size;
            var gjenstående = totalt;
            var feil        = $('.fagtime.utilgjengelig').length;

            for (var [fid, fagtime] of filedata.fagtimer) {
                if (fagtime.get('dag') && fagtime.get('dagtime')) { gjenstående--; }
            }

            var values = totalt + '/' + gjenstående + '/' + feil;
            var line = '<div>Total/gjenstående/feil:      '.substr(0, 43-values.length) + values + '</div>';
            data.add(line);

            var html = '';
            for (var line of data) { html += line; }
            $('#fagtimeinfo').html(html);
        }



        if (use.hover) self.hover = function (fid) {
// TODO:
// Når man hovrer over en gruppe, vis:
// - Alle timer for enkeltelever som er med i gruppa
// - Alle timer for grupper der noen er opptatt
// - Hvor mange elever som er opptatt? (13/32)

            if (fid !== null) {
                fid = fid.split('-')[0]

                var fagtime    = filedata.fagtimer.get(fid);
                var type       = fagtime.get('type');
                var navn       = fagtime.get('navn');
                var romliste   = fagtime.get('romliste');
                var lærerliste = fagtime.get('lærerliste');
                var database   = null;

                if (type === 'elev')   { database = filedata.elevdata.get(navn);   }
                if (type === 'gruppe') { database = filedata.gruppedata.get(navn); }

                var gruppeliste  = database.get('grupper');
                var tilgjengelig = database.get('tilgjengelig');

                var classes = { 'fid': new Map(), 'tid': new Map() }



                for (var [tid, value] of tilgjengelig) {
                    if (value === true) {
                        if (!classes.tid.has(tid)) { classes.tid.set(tid, new Set()); }
                        classes.tid.get(tid).add('tilgjengelig');
                    }
                }



                for (var [fid2, fagtime2] of filedata.fagtimer) {
                    var fagkode2  = fagtime2.get('fag')
                    var varighet2 = filedata.fagressurser.get(fagkode2).get('varighet')

                    if (fagtime2.get('navn') === navn || gruppeliste.has(fagtime2.get('navn'))) {
                        for (var v of [0, 1, 2, 3]) {
                            var restvarighet = varighet2 - 45*v

                            if (restvarighet > 0) {
                                var tid2 = fagtime2.get('dag') + '-' + (parseInt(fagtime2.get('dagtime')) + v)
                                if (!classes.fid.has(fid2)) { classes.fid.set(fid2, new Set()); }
                                if (!classes.tid.has(tid2)) { classes.tid.set(tid2, new Set()); }

                                classes.fid.get(fid2).add('hover_secondary');
                                classes.tid.get(tid2).add('opptatt');
                            }
                        }
                    }
                }

                if (type === 'gruppe') {
                    var elevliste = database.get('elever')
                    for (var elev of [...elevliste]) {
                        var objects = $('#timeplan .fagtime').filter(function () { var result = false; $(this).children('.navn').each(function () { if ($(this).text() === elev) { result = true; } }); return result; }).addClass('hover_secondary');
                    }
                }


                for (var kode of lærerliste) {
                    var lærer = filedata.lærerdata.get(kode);

                    for (var [tid2, value] of lærer.get('tilgjengelig')) {
                        if (value === true) {
                            if (!classes.tid.has(tid2)) { classes.tid.set(tid2, new Set()); }
                            classes.tid.get(tid2).add('tilgjengelig_lærer');
                        }
                    }

                    for (var fid2 of lærer.get('fagtimer')) {
                        var fagtime2  = filedata.fagtimer.get(fid2);
                        var fagkode2  = fagtime2.get('fag')
                        var varighet2 = filedata.fagressurser.get(fagkode2).get('varighet')

                        for (var v of [0, 1, 2, 3]) {
                            var restvarighet = varighet2 - 45*v

                            if (restvarighet > 0) {
                                var tid2 = fagtime2.get('dag') + '-' + (parseInt(fagtime2.get('dagtime')) + v)

                                if (!classes.fid.has(fid2)) { classes.fid.set(fid2, new Set()); }
                                if (!classes.tid.has(tid2)) { classes.tid.set(tid2, new Set()); }

                                classes.fid.get(fid2).add('hover_lærer');
                                classes.tid.get(tid2).add('opptatt_lærer');
                            }
                        }
                    }
                }



                for (var [fid2, data] of classes.fid) { $('.' + fid2).addClass([...data].join(' ')); }
                for (var [tid2, data] of classes.tid) { $('#' + tid2).addClass([...data].join(' ')); }
                $('.' + fid).removeClass('hover_secondary').addClass('hover')
            }



            if (use.status) {
                if (fid === null) {
                    $('#elevinfo').html('');
                    $('#lærerinfo').html('');
                } else {
/****************************************************************/
// Status elev/gruppe
/****************************************************************/

                    var data = new Set();
                    data.add("<div class='navn'>" + navn + "</div>");

                    if (type === 'elev') {
                        var trinn           = database.get('trinn')           || null;
                        var teori           = database.get('teori')           || null;
                        var klasse          = database.get('klasse')          || null;
                        var norsk           = database.get('norsk')           || null;
                        var hovedinstrument = database.get('hovedinstrument') || null;
                        var biinstrument1   = database.get('biinstrument 1')  || null;
                        var biinstrument2   = database.get('biinstrument 2')  || null;
                        var valgfag1        = database.get('valgfag 1')       || null;
                        var valgfag2        = database.get('valgfag 2')       || null;
                        var valgfag3        = database.get('valgfag 3')       || null;

                        var line = ''; var field = '';
                        if (trinn)           { line += trinn;                    } else { line += '   ';   }
                        if (teori)           { line += '-T'   + teori;           } else { line += '   ';   }
                        if (klasse)          { line += '    ' + klasse;          } else { line += '     '; }
                        if (norsk)           { line += '-N'   + norsk;           } else { line += '   ';   }
                        if (hovedinstrument) { line += '    ' + hovedinstrument; } else { line += '     '; }
                        data.add("<div>" + line + "</div>");

                        line = '';
                        field = '';
                        if (biinstrument1)   { field = 'Bi1: ' + biinstrument1 + '                         '; }
                        else                 { field = '     ' +                 '                         '; }
                        field = field.substr(0, 16);
                        line += field + '   ';

                        field = '';
                        if (biinstrument2)   { field = 'Bi2: ' + biinstrument2 + '                         '; }
                        else                 { field = '     ' +                 '                         '; }
                        field = field.substr(0, 16);
                        line += field;

                        data.add("<div>" + line + "</div>");

                        data.add("<div>" + (valgfag1 || '') + "</div>");
                        data.add("<div>" + (valgfag2 || '') + "</div>");
                        data.add("<div>" + (valgfag3 || '') + "</div>");
                    }

                    if (type === 'gruppe') {
                        var elever = database.get('elever');
                        data.add('Antall elever: ' + elever.size);
                    }

                    var html = '';
                    for (var line of data) { html += line; }
                    $('#elevinfo').html(html);



/****************************************************************/
// Status lærere
/****************************************************************/

                    var data    = new Set();

                    var hoved   = 0;
                    var bi      = 0;
                    var teori   = 0;
                    var annet   = 0;
                    var mandag  = 0;
                    var tirsdag = 0;
                    var onsdag  = 0;
                    var torsdag = 0;
                    var fredag  = 0;
                    var dager   = 0;
                    var timer   = 0;

                    if (lærerliste.length === 1) {
                        var lærer = filedata.lærerdata.get(lærerliste[0]).get('navn');
                        data.add("<div class='navn'>" + lærer + "</div>");

                        for (var lærer of lærerliste) {
                            if (filedata.lærerdata.has(lærer) && filedata.lærerdata.get(lærer).get('fagtimer').size > 0) {
                                for (var fid of filedata.lærerdata.get(lærer).get('fagtimer')) {
                                    var fagtime  = filedata.fagtimer.get(fid);
                                    var fagkode  = fagtime.get('fag')
                                    var varighet = filedata.fagressurser.get(fagkode).get('varighet') / 45

                                    if      (fagtime.get('fag') === 'Hov')                                      { hoved += varighet; }
                                    else if (['Hov', 'Bes', 'Bi 1', 'Bi 2'].indexOf(fagtime.get('fag')) !== -1) { bi    += varighet; }
                                    else if (['Mus.teori', 'Satslære'].indexOf(fagtime.get('fag')) !== -1)      { teori += varighet; }
                                    else                                                                        { annet += varighet; }

                                    if      (fagtime.get('dag') === 'mandag')  { mandag  += varighet; }
                                    else if (fagtime.get('dag') === 'tirsdag') { tirsdag += varighet; }
                                    else if (fagtime.get('dag') === 'onsdag')  { onsdag  += varighet; }
                                    else if (fagtime.get('dag') === 'torsdag') { torsdag += varighet; }
                                    else if (fagtime.get('dag') === 'fredag')  { fredag  += varighet; }
                                }
                            }
                        }

                        if (mandag  > 0) { dager++; }
                        if (tirsdag > 0) { dager++; }
                        if (onsdag  > 0) { dager++; }
                        if (torsdag > 0) { dager++; }
                        if (fredag  > 0) { dager++; }
                        timer = mandag+tirsdag+onsdag+torsdag+fredag;

                        line = 'Hoved-timer:   '.substr(0, 15-hoved.toString().length) + Math.ceil(hoved) + '      Teorifagtimer:   '.substr(0, 23-teori.toString().length) + Math.ceil(teori);
                        data.add("<div>" + line + "</div>");

                        line = 'Bi-timer:      '.substr(0, 15-bi.toString().length)    + Math.ceil(bi)    + '      Andre timer:     '.substr(0, 23-annet.toString().length) + Math.ceil(annet);
                        data.add("<div>" + line + "</div>");

                        line = 'Dager/timer:  ' + dager + '/' + Math.ceil(timer);
                        data.add("<div>" + line + "</div>");

                    }

                    if (lærerliste.length > 1) {
                        data.add("<div class='navn'>Flere lærere</div>");
                    }

                    var html = '';
                    for (var line of data) { html += line; }

                    $('#lærerinfo').html(html);
                }
            }
        }



        if (use.filter) self.filter = function (action) {
            if (action === 'reset') {
                $('#filtergruppe').val('Alle'),
                $('#filterfag').val('alle'),
                $('#filterlærer').val('alle'),
                $('#filtersearch').val(''),

                $('.fagtime').removeClass('filtered');
            } else {
                var filter = {
                    timeplan: $('#filtertimeplan').prop('checked'),
                    gruppe:   $('#filtergruppe').val(),
                    fag:      $('#filterfag').val(),
                    lærer:    $('#filterlærer').val(),
                    search:   $('#filtersearch').val(),
                }

                var active = {
                    timeplan: filter.timeplan === true   ? true : false,
                    gruppe:   filter.gruppe   !== 'Alle' ? true : false,
                    fag:      filter.fag      !== 'alle' ? true : false,
                    lærer:    filter.lærer    !== 'alle' ? true : false,
                    search:   filter.search   !== ''     ? true : false,
                }

                var fidset = {
                    alle:   new Set(),
                    gruppe: new Set(),
                    fag:    new Set(),
                    lærer:  new Set(),
                    search: new Set(),
                    result: new Set(),
                }



                if (filedata.fagtimer) {
                    for (var [fid, fagtime] of filedata.fagtimer) {
                        var fagkode = fagtime.get('fag')
                        var fagnavn = filedata.fagressurser.get(fagkode).get('navn')

                        fidset.alle.add(fid);
                        if (active.fag)   { if (fagkode                                         === filter.fag) { fidset.fag.add(fid);   } }
                        if (active.lærer) { if (fagtime.get('lærerliste').indexOf(filter.lærer) !== -1)         { fidset.lærer.add(fid); } }

                        if (active.search) {
                            var regex = new RegExp(filter.search, 'i');
                            if (regex.test(fagkode)) { fidset.search.add(fid); }
                            if (regex.test(fagnavn)) { fidset.search.add(fid); }
                        }
                    }
                }

                if (filedata.elevdata) {
                    for (var [navn, elev] of filedata.elevdata) {
                        if (active.gruppe) {
                            if (elev.get('grupper').has(filter.gruppe)) {
                                for (var fid of elev.get('fagtimer')) { fidset.gruppe.add(fid); }
                            }
                        }

                        if (active.search) {
                            var regex = new RegExp(filter.search, 'i');
                            if (regex.test(elev.get('navn'))) {
                                for (var fid of elev.get('fagtimer')) { fidset.search.add(fid); }
                            }
                        }
                    }
                }

                if (filedata.gruppedata) {
                    for (var [navn, gruppe] of filedata.gruppedata) {
                        if (active.gruppe) {
                            if (gruppe.get('navn') === filter.gruppe) {
                                for (var fid of gruppe.get('fagtimer')) { fidset.gruppe.add(fid); }
                            }
                        }

                        if (active.search) {
                            var regex = new RegExp(filter.search, 'i');
                            if (regex.test(gruppe.get('navn'))) {
                                for (var fid of gruppe.get('fagtimer')) { fidset.search.add(fid); }
                            }
                        }
                    }
                }



                fidset.result = new Set([...fidset.alle]);
                if (active.gruppe) { fidset.result = timeplan.bool.intersection(fidset.result, fidset.gruppe); }
                if (active.fag)    { fidset.result = timeplan.bool.intersection(fidset.result, fidset.fag);    }
                if (active.lærer)  { fidset.result = timeplan.bool.intersection(fidset.result, fidset.lærer);  }
                if (active.search) { fidset.result = timeplan.bool.intersection(fidset.result, fidset.search); }

                $('.fagtime').removeClass('filtered');
                if (active.timeplan) { $('.fagtime').addClass('filtered');       for (var fid of fidset.result) { $('.' + fid).removeClass('filtered'); } }
                else                 { $('#pool .fagtime').addClass('filtered'); for (var fid of fidset.result) { $('#pool').find('#' + fid).removeClass('filtered'); } }
            }
        }



        if (use.datafile) {
            var html = "                <input id='fil' type='file' name='fil[]' value='Excel-fil'/>"
                     + "                <img id='visinfo' src='resources.php?file=question.svg' />"
                     + "                <button id='publiser'>Publiser</button>"
                     + "                <button id='lagre'>Lagre</button>"
            $('#verktøy').append(html);
        }
        if (use.status) {
            var html = "                <div id='status'>"
                     + "                    <div id='fagtimeinfo'></div>"
                     + "                    <div id='elevinfo'></div>"
                     + "                    <div id='lærerinfo'></div>"
                     + "                </div>"
            $('#verktøy').append(html);
        }
        if (use.filter) {
            var html = "                <div class='filter'>"
                     + "                    <div><button id='filterreset'>Nullstill filter</button><span class='lang'>Filtrer også timeplan</span><input type='checkbox' id='filtertimeplan' /></div>"
                     + "                    <div><span>Gruppe:</span><select id='filtergruppe'></select></div>"
                     + "                    <div><span>Lærer:</span><select id='filterlærer'></select></div>"
                     + "                    <div><span>Fag:</span><select id='filterfag'></select></div>"
                     + "                    <div><span>Søk:</span><input type='text' id='filtersearch' /></div>"
                     + "                </div>"

            $('#pool').prepend(html);
        }



        return {
            'reset':   self.reset,
            'load':    self.load,
            'fagtime': self.fagtime,
            'markup':  self.markup,
            'hover':   self.hover,
            'filter':  self.filter,
        }
    })();



    timeplan.event = (function () {
        var self = {
            // PRIVATE:
            'freeze':     true,
            'keyupfunc':  {},
            'keyuplist':  { 'esc': null, 'enter': null },

            'resize':     () => { console.log('UNDEFINED FUNCTION: event.resize()');     },
            'reset':      () => { console.log('UNDEFINED FUNCTION: event.reset()');      },
            'drop' :      () => { console.log('UNDEFINED FUNCTION: event.drop()');       },
            'datavelger': () => { console.log('UNDEFINED FUNCTION: event.datavelger()'); },
            'hover':      () => { console.log('UNDEFINED FUNCTION: event.hover()');      },
            'search':     () => { console.log('UNDEFINED FUNCTION: event.search()');     },

            // PUBLIC:
            'load':       () => { console.log('UNDEFINED FUNCTION: event.load()');       },
            'update':     () => { console.log('UNDEFINED FUNCTION: event.update()');     },
        }



        self.keyupfunc.datavelgerexit = function () { self.datavelgerexit(); }
        self.keyupfunc.searchupdate   = function () { timeplan.view.filter(); }
        self.keyupfunc.searchblur     = function () { $('#filtersearch').blur(); }
        self.keyupfunc.searchreset    = function () { $('#filtersearch').blur().val(''); timeplan.view.filter(); }
        self.keyupfunc.freeze         = function () { self.hover('thaw'); }



        self.resize = function () {
            var window_height   = $(window).height();
            var pool_offset     = $('#pool > .fagtimecontainer').offset();
            var pool_height     = window_height - pool_offset.top - 17;

            var timeplan_offset = $('#timeplan').offset();
            var timeplan_height = window_height - timeplan_offset.top - 8;
            var info_height     = timeplan_height - 25;

            var timeplan_width  = $('#timeplan').width();
            var info_width      = timeplan_width - 25;

            $('#pool > .fagtimecontainer').outerHeight(pool_height);
            $('#timeplan').outerHeight(timeplan_height);
            $('#info').outerHeight(info_height);
            $('#info').outerWidth(info_width);
        }



        self.load = function () {
            self.reset();
            self.resize();
        }



        if (use.modify) self.reset = function () {
            self.freeze          = false;
            self.keyuplist.esc   = new Set();
            self.keyuplist.enter = new Set();



            var droppable = {
                'over':  () => { console.log('UNDEFINED FUNCTION: event.reset -> droppable.over()'); },
                'out':   () => { console.log('UNDEFINED FUNCTION: event.reset -> droppable.out()');  },
            }



            droppable.over = function (event, ui) {
                var dropid       = $(event.target).attr('id')
                var fid          = $(ui.draggable).attr('id');
                var tid          = dropid

                var fagtime      = filedata.fagtimer.get(fid)
                var fagkode      = fagtime.get('fag')
                var varighet     = filedata.fagressurser.get(fagkode).get('varighet')
                var type         = fagtime.get('type');
                var navn         = fagtime.get('navn');
                var database     = null

                var tilgjengelig = true
                var [dropdag, dropdagtime] = dropid.split('-')

                if (type === 'elev')   { database = filedata.elevdata.get(navn)   }
                if (type === 'gruppe') { database = filedata.gruppedata.get(navn) }

                var sistetime = null
                if (varighet >   0 && dropdagtime <= 10) { sistetime = dropdag + '-' + (parseInt(dropdagtime) + 0); }
                if (varighet >  45 && dropdagtime <=  9) { sistetime = dropdag + '-' + (parseInt(dropdagtime) + 1); }
                if (varighet >  90 && dropdagtime <=  8) { sistetime = dropdag + '-' + (parseInt(dropdagtime) + 2); }
                if (varighet > 135 && dropdagtime <=  7) { sistetime = dropdag + '-' + (parseInt(dropdagtime) + 3); }

                var offset = $(event.target).offset()
                var width  = $(event.target).width()
                var height = ($('#' + sistetime).offset().top + $('#' + sistetime).height()) - offset.top

                $(event.target).append('<div class="placefagtime"></div>')
                $('.placefagtime').offset({ top: offset.top, left: offset.left }).width(width).height(height)

                for (var v of [0, 1, 2, 3]) {
                    var restvarighet = varighet - 45*v
                    if (restvarighet > 0) {
                        tilgjengelig &= database.get('tilgjengelig').get(dropdag + '-' + (parseInt(dropdagtime) + v));
                    }
                }

                if (tilgjengelig == false) { $('.placefagtime').addClass('utilgjengelig') }

                for (var rom of filedata.fagtimer.get(fid).get('romliste')) {
                    $(event.target).children('.tilgjengeligerom').find('.rom').filter(function () { return $(this).children('.kode').text() === rom; }).addClass('droptarget');
                }

            }



            droppable.out = function (event, ui) {
                $(event.target).find('.placefagtime').remove()
                $(event.target).find('.tilgjengeligerom > .rom').removeClass('droptarget');
            }



            $('.tilgjengeligerom > .rom').droppable({
                  drop:         function (event, ui) { self.drop('rom', this, event, ui); }
                , hoverClass:   'droptarget'
                , accept:       '.fagtime'
                , greedy:       false
            });

            $('td').droppable({
                  drop:         function (event, ui) { self.drop('dag', this, event, ui); }
                , accept:       '.fagtime'
                , over:         droppable.over
                , out:          droppable.out
            });

            $('#pool').droppable({
                  drop:         function (event, ui) { self.drop('pool', this, event, ui); }
                , accept:       '.fagtime'
            });

            self.update();
        }



        if (use.modify) self.update = function () {
            var draggable = {
                'start': () => { console.log('UNDEFINED FUNCTION: event.update -> draggable.start()'); },
                'stop':  () => { console.log('UNDEFINED FUNCTION: event.update -> draggable.start()'); },
            }



            draggable.start = function (event, ui) {
                if (use.hover) $(document).off('mouseenter', '.fagtime');
                if (use.hover) $(document).off('mouseleave', '.fagtime');
                $(this).draggable('instance').offset.click = {
                    top:  Math.floor(ui.helper.height() / 2),
                    left: Math.floor(ui.helper.width()  / 2)
                }
                $('.hover, .hover_secondary').addClass('negative')
            }
            draggable.stop = function () {
                if (use.hover) $(document).on('mouseenter', '.fagtime', function () { self.hover('enter', this); });
                if (use.hover) $(document).on('mouseleave', '.fagtime', function () { self.hover('leave', this); });
                $('.hover, .hover_secondary').removeClass('negative')
                $('.droptarget').removeClass('droptarget')
            }



            $('.fagtime:not(.fortsettelse)').draggable({
                  cursor:         'move'
                , addClasses:     false
                , scroll:         false
                , revert:         true
                , revertDuration: 200
                , start:          draggable.start
                , stop:           draggable.stop
            });
        }



        if (use.modify) self.drop = function (type, droppable, event, ui) {
            self.hover('thaw');
            $('.placefagtime').remove()
            $('.hover, .hover_secondary').removeClass('negative')

            var object    = $(ui.draggable);
            var fid       = $(object).attr('id');
            var fagtime   = filedata.fagtimer.get(fid);
            var fagkode   = fagtime.get('fag')
            var varighet  = filedata.fagressurser.get(fagkode).get('varighet')
            var gammeltid = new Set()

            for (var v of [0, 1, 2, 3]) {
                var restvarighet = varighet - 45*v

                if (restvarighet > 0) {
                    var tid2 = fagtime.get('dag') + '-' + (parseInt(fagtime.get('dagtime')) + v)
                    gammeltid.add(tid2)
                }
            }

            if (type === 'rom') {
                var kode = $(droppable).children('.kode').text();
                var tid  = $(droppable).parents('.dagtime').attr('id');

                timeplan.data.modify(fid, { 'romliste': [kode], 'tid': tid });
                timeplan.view.fagtime(filedata.fagtimer.get(fid), gammeltid);
            }

            if (type === 'dag') {
                var tid = $(droppable).attr('id');

                timeplan.data.modify(fid, { 'tid': tid });
                timeplan.view.fagtime(filedata.fagtimer.get(fid), gammeltid);
            }

            if (type === 'pool') {
                timeplan.data.modify(fid, { 'tid': null });
                timeplan.view.fagtime(filedata.fagtimer.get(fid), gammeltid);
            }
        }



        if (use.modify) self.datavelger = function (type, object, e) {
            var fid     = $(object).parents('.fagtime').attr('id');
            var fagtime = filedata.fagtimer.get(fid);
            var dag     = fagtime.get('dag');
            var dagtime = fagtime.get('dagtime');
            var tid     = dag + '-' + dagtime;

            var datamap = new Map();
            if (type === 'romliste') {
                var romliste = [...filedata.romdata].sort();
                for (var [id, rom] of romliste) {
                    datamap.set(id, { });
                    datamap.get(id).primær       = false;
                    datamap.get(id).valgt        = false;
                    datamap.get(id).kode         = rom.get('navn');
                    datamap.get(id).tilgjengelig = rom.get('tilgjengelig').get(tid);

                    var fagliste   = new Set();
                    var lærerliste = new Set();

                    for (var fid2 of filedata.romdata.get(id).get('fagtimer')) {
                        var fagtime2 = filedata.fagtimer.get(fid2);
                        var dag2     = fagtime2.get('dag');
                        var dagtime2 = fagtime2.get('dagtime');
                        var tid2     = dag2 + '-' + dagtime2;
                        if (tid2 === tid) {
                            fagliste.add(fagtime2.get('fag'));
                            for (var lærer of fagtime2.get('lærerliste')) {
                                lærerliste.add(lærer);
                            }
                            var info = [...fagliste].join(' ') + ' / ' + [...lærerliste].join(' ');
                            datamap.get(id).info = info;
                        }
                    }

                    if (fagtime.get('romliste').indexOf(id) !== -1) {
                        datamap.get(id).valgt = true;
                        if (fagtime.get('romliste')[0] == id) {
                            datamap.get(id).primær = true;
                        }
                    }
                }
            }

            if (type === 'lærerliste') {
                var fagkode    = fagtime.get('fag');
                var lærerliste = filedata.fagressurser.get(fagkode).get('lærerliste');
                var lærerliste = lærerliste.sort();

                for (var id of lærerliste) {
                    var lærer = filedata.lærerdata.get(id);
                    datamap.set(id, { });
                    datamap.get(id).primær       = false;
                    datamap.get(id).valgt        = false;
                    datamap.get(id).kode         = lærer.get('kode');
                    datamap.get(id).navn         = lærer.get('navn');
                    datamap.get(id).tilgjengelig = lærer.get('tilgjengelig').get(tid);

                    var fagliste   = new Set();
                    var romliste   = new Set();

                    for (var fid2 of filedata.lærerdata.get(id).get('fagtimer')) {
                        var fagtime2 = filedata.fagtimer.get(fid2);
                        var dag2     = fagtime2.get('dag');
                        var dagtime2 = fagtime2.get('dagtime');
                        var tid2     = dag2 + '-' + dagtime2;
                        if (tid2 === tid) {
                            fagliste.add(fagtime2.get('fag'));
                            for (var rom of fagtime2.get('romliste')) {
                                romliste.add(rom);
                            }
                            var info = [...fagliste].join(' ') + ' / ' + [...romliste].join(' ');
                            datamap.get(id).info = info;
                        }
                    }

                    if (fagtime.get('lærerliste').indexOf(id) !== -1) {
                        datamap.get(id).valgt = true;
                        if (fagtime.get('lærerliste')[0] == id) {
                            datamap.get(id).primær = true;
                        }
                    }
                }
            }

            var html = '';
            html += "<div id='datavelger'>";
            html += "<div class='type hidden'>" + type + "</div>";

            for (var [id, data] of datamap) {
                var classet = new Set(['data']);
                if (data.primær       === true)  { classet.add('primær'); }
                if (data.valgt        === true)  { classet.add('valgt'); }
                if (data.tilgjengelig === false) { classet.add('utilgjengelig'); }

                var classes = [...classet].join(' ');
                html += "<div class='" + classes + "'>";
                                      html += "<span class='id'>"   + id        + "</span>";
                if ('kode' in data) { html += "<span class='kode'>" + data.kode + "</span>"; }
                if ('navn' in data) { html += "<span class='navn'>" + data.navn + "</span>"; }
                if ('info' in data) { html += "<span class='info'>" + data.info + "</span>"; }
                html += "</div>";
            }

            html += "</div>";

            $('body').append(html);

            var height = $('#datavelger').outerHeight();
            var width  = $('#datavelger').outerWidth();

            var top   = Math.min(e.pageY + height, $(window).height()) - height - 20;
            var left  = Math.min(e.pageX + width,  $(window).width())  - width  - 20;

            $('#datavelger').offset({ 'top': top, 'left': left });

            $(document).on('click', '#datavelger .data', function () {
                $(this).toggleClass('valgt');

                if ($('#datavelger').find('.valgt.primær').length != 1) {
                    $('#datavelger').find('.primær').removeClass('primær')
                    $('#datavelger').find('.valgt').first().addClass('primær')
                }
            });

            $(document).on('mouseleave', '#datavelger',  function () { self.datavelgerexit(type, fid, 'save'); });

            self.keyuplist.esc.add(self.keyupfunc.datavelgerexit);
        }



        if (use.modify) self.datavelgerexit = function (type, fid, save) {
            self.hover('thaw');

            if (save === 'save') {
                var valgt  = new Set();
                var primær = $('#datavelger').find('.valgt.primær > .id').text()
                var liste  = []

                $('#datavelger').find('.valgt:not(.primær) > .id').each(function () { valgt.add($(this).text()); });
                if (primær) { liste = [primær].concat([...valgt]) }

                if (type === 'romliste')   { timeplan.data.modify(fid, { 'romliste':   liste }); }
                if (type === 'lærerliste') { timeplan.data.modify(fid, { 'lærerliste': liste }); }
                timeplan.view.fagtime(filedata.fagtimer.get(fid));
            }

            $(document).off('click',      '#datavelger .data');
            $(document).off('mouseleave', '#datavelger');
            $('#datavelger').remove();
        }



        if (use.hover) self.hover = function (action, object) {
            if (action === 'enter') {
                if (self.freeze === false) {
                    var fid = $(object).attr('id');
                    timeplan.view.hover(fid);
                }
            }

            if (action === 'leave') {
                if (self.freeze === false) {
                    timeplan.view.hover(null);
                    $('.fagtime').removeClass('hover hover_secondary hover_lærer negative');
                    $('.dagtime').removeClass('tilgjengelig opptatt tilgjengelig_lærer opptatt_lærer');
                }
            }

            if (action === 'freeze') {
                self.freeze = false;
                self.hover('leave');
                self.hover('enter', object);
                self.freeze = true;

                self.keyuplist.esc.add(self.keyupfunc.freeze);
            }

            if (action === 'thaw') {
                self.freeze = false;
                self.hover ('leave');
            }
        }



        if (use.filter) self.search = function () {
            self.keyuplist.esc.add(self.keyupfunc.searchreset);
            $(document).on('blur', '#filtersearch', function () { self.keyuplist.esc.delete(self.keyupfunc.searchreset); });
        }



        $(document).on('click', '#visinfo', function () { $('#info').toggle(); });

        if (use.datafile) {
            $(document).on('change', '#fil',      timeplan.data.load);
            $(document).on('click',  '#lagre',    timeplan.data.save);
            $(document).on('click',  '#publiser', timeplan.data.publish);
        }
        if (use.modify) {
            $(document).on('click', '.fagtime .rom',   function (e) { self.datavelger('romliste',   this, e); });
            $(document).on('click', '.fagtime .lærer', function (e) { self.datavelger('lærerliste', this, e); });
        }
        if (use.hover) {
            $(document).on('mouseenter', '.fagtime', function () { self.hover('enter', this);  });
            $(document).on('mouseleave', '.fagtime', function () { self.hover('leave', this);  });
            $(document).on('click',      '.fagtime', function () { self.hover('freeze', this); });
        }
        if (use.filter) {
            $(document).on('click',  '#filterreset',           function () { timeplan.view.filter('reset'); });
            $(document).on('change', '#filtertimeplan',        function () { timeplan.view.filter();        });
            $(document).on('change', '#pool > .filter select', function () { timeplan.view.filter();        });
            $(document).on('focus',  '#filtersearch',          function () { self.search();                 });
        }

        $(document).on('keyup', function (e) {
            if (e.keyCode === 27) {
                if (self.keyuplist.esc && self.keyuplist.esc.size > 0) {
                    var funcs = [...self.keyuplist.esc];
                    var func = funcs.pop();
                    func();
                    self.keyuplist.esc = new Set(funcs);
                }
            }

            if (e.keyCode === 13) {
                if (self.keyuplist.enter && self.keyuplist.enter.size > 0) {
                    var funcs = [...self.keyuplist.enter];
                    var func = funcs.pop();
                    func();
                    self.keyuplist.enter = new Set(funcs);
                }
            }

            self.keyupfunc.searchupdate();
        });

        $(window).on('resize', self.resize );
        self.resize();



        return {
            'load':   self.load,
            'update': self.update,
        }
    })();



    timeplan.html = (function () {
        var self = {
            // PUBLIC:
            'info': () => { console.log('UNDEFINED FUNCTION: html.info()'); },
            'load': () => { console.log('UNDEFINED FUNCTION: html.load()'); },
        }



        self.info = function () {
            var result = '';
            result = "<div class='overskrift'>Velkommen til dette timeplanleggingsprogrammet!</div>"
                   + "<div class='seksjon'>Skjermen er delt opp i tre hoveddeler:</div>"
                   + "<div>"
                   + "- Øverst til venstre åpner, lagrer og publiserer du filer. 'Lagre' gir deg en Excel-fil, 'Publiser' gir deg timeplaner som PDF.<br />"
                   + "- Rett under filfunksjonene vil du se statusinfo.<br />"
                   + "- Til venstre er alle fagtimer som ikke har blitt plassert. Her er også verktøy for søk og filter.<br />"
                   + "- Til høyre er timeplanen med alle plasserte timer. (Det dukker ikke opp før du åpner en fil.)<br />"
                   + "</div>"

                   + "<div class='seksjon'>Fagtimer:</div>"
                   + "<div>"
                   + "- For å plassere en fagtime i timeplanen drar du den til en dag og time, eventuelt direkte til et rom. Du kan også dra den til de uplasserte timene til venstre.<br />"
                   + "- Du kan også endre rom og lærer ved å klikke på dem i fagtimene. Læreren eller rommet med fet skrift dukker opp på fellestimeplanen.<br />"
                   + "- Du kan ikke angre på endringer (ingen Ctrl+Z), men du kan jo bare bytte tilbake igjen...<br />"
                   + "- Du kan klikke på en fagtime for å 'fryse' statusfargekodene. For å avslutte frysingen trykker du 'esc'.<br />"
                   + "</div>"

                   + "<div class='seksjon'>I timeplanen finner du disse elementene:</div>"
                   + "<div>"
                   + "- Dag/time: Timeplanen består av en celle per dag/time.<br />"
                   + "- Romliste: En oversikt over rom som er tilgjengelige denne timen. Du kan dra fagtimer direkte hit.<br />"
                   + "- Fagtimer: En fagtime er én time med én elev eller gruppe. Den representeres ved en linje med data i en dag/time.<br />"
                   + "</div>"
                   + "<table>"
                   + "    <tr>"
                   + "        <td class='info_dagtime'>"
                   + "            <div class='header'>mandag 3. time</div>"
                   + "            <div class='info_tilgjengeligerom'><div class='rom'>007</div><div class='rom'>107</div><div class='rom'>225</div><div class='rom'>226</div><div class='rom'>227</div><div class='rom'>229</div><div class='rom'>230</div><div class='rom'>231</div><div class='rom'>232</div><div class='rom'>321</div><div class='rom'>322</div><div class='rom'>323</div><div class='rom'>324</div><div class='rom'>Sal 2</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Normal time</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>(+)</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Time med flere rom</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer'>(+)</div><div class='fag'>Hov</div><div class='navn'>Time med flere lærere</div></div>"
                   + "        </td>"
                   + "    </tr>"
                   + "</table>"

                   + "<div class='seksjon'>Fargekoder</div>"
                   + "<div>"
                   + "- Det er ganske mange fargekoder å holde styr på, men jeg har forsøkt å gjøre det så logisk som mulig.<br />"
                   + "- Rødt er et dårlig tegn. Noe er galt!<br />"
                   + "- Grønt er et godt tegn. Gult er heller ikke så verst.<br />"
                   + "- Blått og lilla er et tegn på at noe eller noen er opptatt, men det er sannsynligvis greit.<br />"
                   + "</div>"

                   + "<div class='seksjon'>Fagtimer er fargekodet slik:</div>"
                   + "<table>"
                   + "    <tr><th>Normale timer og hover</th><th>Farger angående eleven</th><th>Farger angående læreren</th><th>Farger angående rommet</th></tr>"
                   + "    <tr>"
                   + "        <td class='info_dagtime'>"
                   + "            <div class='header'>mandag 3. time</div>"
                   + "            <div class='info_tilgjengeligerom'><div class='rom'>007</div><div class='rom'>107</div><div class='rom'>225</div><div class='rom'>226</div><div class='rom'>227</div><div class='rom'>229</div><div class='rom'>230</div><div class='rom'>231</div><div class='rom'>232</div><div class='rom'>321</div><div class='rom'>322</div><div class='rom'>323</div><div class='rom'>324</div><div class='rom'>Sal 2</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Vanlig utseende</div></div>"
                   + "            <div class='info_fagtime hover'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Hover: elevtimer</div></div>"
                   + "            <div class='info_fagtime hover_lærer'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Hover: lærertimer</div></div>"
                   + "        </td>"
                   + "        <td class='info_dagtime'>"
                   + "            <div class='header'>mandag 3. time</div>"
                   + "            <div class='info_tilgjengeligerom'><div class='rom'>007</div><div class='rom'>107</div><div class='rom'>225</div><div class='rom'>226</div><div class='rom'>227</div><div class='rom'>229</div><div class='rom'>230</div><div class='rom'>231</div><div class='rom'>232</div><div class='rom'>321</div><div class='rom'>322</div><div class='rom'>323</div><div class='rom'>324</div><div class='rom'>Sal 2</div></div>"
                   + "            <div class='info_fagtime opptatt'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Opptatt</div></div>"
                   + "            <div class='info_fagtime utilgjengelig'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Ikke tilgjengelig</div></div>"
                   + "            <div class='info_fagtime overbooket'><div class='rom'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Overbooket</div></div>"
                   + "        </td>"
                   + "        <td class='info_dagtime'>"
                   + "            <div class='header'>mandag 3. time</div>"
                   + "            <div class='info_tilgjengeligerom'><div class='rom'>007</div><div class='rom'>107</div><div class='rom'>225</div><div class='rom'>226</div><div class='rom'>227</div><div class='rom'>229</div><div class='rom'>230</div><div class='rom'>231</div><div class='rom'>232</div><div class='rom'>321</div><div class='rom'>322</div><div class='rom'>323</div><div class='rom'>324</div><div class='rom'>Sal 2</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer multi'>BEH</div><div class='fag'>Hov</div><div class='navn'>Flere rom samtidig</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer utilgjengelig'>BEH</div><div class='fag'>Hov</div><div class='navn'>Ikke tilgjengelig</div></div>"
                   + "            <div class='info_fagtime'><div class='rom'>230</div><div class='lærer overbooket'>BEH</div><div class='fag'>Hov</div><div class='navn'>Overbooket</div></div>"
                   + "        </td>"
                   + "        <td class='info_dagtime'>"
                   + "            <div class='header'>mandag 3. time</div>"
                   + "            <div class='info_tilgjengeligerom'>"
                   + "                <div class='rom'>ledig</div>"
                   + "                <div class='rom opptatt'>opptatt</div>"
                   + "                <div class='rom overbooket'>overbooket</div>"
                   + "                <div class='rom utilgjengelig'>utilgjengelig</div>"
                   + "                <div class='rom utilgjengelig opptatt'>utilgjengelig og opptatt</div>"
                   + "                <div class='rom'>ledig</div>"
                   + "            </div>"
                   + "            <div class='info_fagtime'><div class='rom multi'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Flere lærere samtidig</div></div>"
                   + "            <div class='info_fagtime'><div class='rom utilgjengelig'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Ikke tilgjengelig</div></div>"
                   + "            <div class='info_fagtime'><div class='rom overbooket'>230</div><div class='lærer'>BEH</div><div class='fag'>Hov</div><div class='navn'>Overbooket</div></div>"
                   + "        </td>"
                   + "    </tr>"
                   + "</table>"

                   + "<div class='seksjon'>Når du holder musepekeren over en fagtime blir timeplanen fargekodet slik:</div>"
                   + "<table>"
                   + "    <tr><th>Eleven er ikke tilgjengelig</th><th>Eleven er ledig</th><th>Eleven og læreren er ledig</th><th>Eleven har musikkundervisning</th></tr>"
                   + "    <tr>"
                   + "        <td class='info_dagtime'><div class='info_fagtime'></div></td>"
                   + "        <td class='info_dagtime tilgjengelig'><div class='info_fagtime'></div></td>"
                   + "        <td class='info_dagtime tilgjengelig tilgjengelig_lærer'><div class='info_fagtime'></div></td>"
                   + "        <td class='info_dagtime tilgjengelig opptatt'><div class='info_fagtime'></div></td>"
                   + "    </tr>"
                   + "</table>"
                   ;

            return result;
        }



        self.load = function () {
            var result = "";
            result += "<table class='fagtimecontainer'>";
            result += "<tbody>";
            for (var [dagtime, klokkeslett] of [['3', '10:25-11:10'], ['4', '11:15-12:00'], ['5', '12:05-12:50'], ['6', '13:00-13:45'], ['7', '13:55-14:40'], ['8', '14:50-15:35'], ['9', '15:45-16:30'], ['10', '16:30-17:15']]) {
                result += "<tr>";
                for (var dag of ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag']) {
                    result += "<td class='dagtime' id='" + dag + '-' + dagtime + "'>"
                           +      "<div class='header'>" + dag + " " + dagtime + ".time (" + klokkeslett + ")</div>"
                           +      "<div class='tilgjengeligerom'></div>"
                           +      "<div class='fagtimer'></div>"
                           +  "</td>"
                           ;
                }
                result += "</tr>";
            }
                result += "</tbody>";
                result += "</table>";


            return result;
        }



        return {
            'info': self.info,
            'load': self.load,
        }
    })();



    timeplan.view.reset();
});



/****************************************************************/
//
//  Main
//
/****************************************************************/

$(document).ready(function () {
    var timeplan = new Timeplan();
});
