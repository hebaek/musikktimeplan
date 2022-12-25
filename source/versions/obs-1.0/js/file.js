'use strict';



var file = (function () {
    var engine = {
        excel: 'xlsx-populate',
        pdf:   'jspdf',
    }



    var utilities = {
        'timestamp':     () => { console.log('UNDEFINED FUNCTION: file.utilities.timestamp()');       },
        'namelist':      () => { console.log('UNDEFINED FUNCTION: file.utilities.namelist()');        },
    }



    var sorters = {
        'navn':    () => { console.log('UNDEFINED FUNCTION: file.sorters.navn()');      },
    }


    var self = {
        // PRIVATE:
        'load:xlsx-populate': () => { console.log('UNDEFINED FUNCTION: file.load:xlsx-populate()'); },
        'save:xlsx-populate': () => { console.log('UNDEFINED FUNCTION: file.save:xlsx-populate()'); },
        'publish:jspdf':      () => { console.log('UNDEFINED FUNCTION: file.publish:jspdf()');      },

        // PUBLIC:
        'load':               () => { console.log('UNDEFINED FUNCTION: file.load()');               },
        'save':               () => { console.log('UNDEFINED FUNCTION: file.save()');               },
        'publish':            () => { console.log('UNDEFINED FUNCTION: file.publish()');            },
    }


    utilities.timestamp = () => {
        var tidspunkt = new Date();
        var år        = tidspunkt.getFullYear();
        var måned     = tidspunkt.getMonth()+1; if (måned    < 10) { måned    = '0' + måned;    }
        var dag       = tidspunkt.getDate();    if (dag      < 10) { dag      = '0' + dag;      }
        var timer     = tidspunkt.getHours();   if (timer    < 10) { timer    = '0' + timer;    }
        var minutter  = tidspunkt.getMinutes(); if (minutter < 10) { minutter = '0' + minutter; }
        var tid       = år + '-' + måned + '-' + dag + '-' + timer + minutter;

        return tid
    }


    utilities.namelist = (person) => {
        let first = person.first.split(' ')
        let last  = person.last.split(' ')
    
        let name = [
            `${first.join(' ')} ${last.join(' ')}`,
            `${first[0]} ${last.join(' ')}`,
            `${first[0][0]} ${last.join(' ')}`,
            `${first[0][0]} ${last[0]}`,
            `${first[0][0]} ${last[0][0]}`,
            `${first[0][0]}${last[0][0]}`,
        ]
    
        if ('middle' in person && person.middle) {
            let middle = person.middle.split(' ')
    
            name.unshift(`${first.join(' ')} ${middle[0][0]} ${last.join(' ')}`)
            name.unshift(`${first.join(' ')} ${middle[0]} ${last.join(' ')}`)
            name.unshift(`${first.join(' ')} ${middle.join(' ')} ${last.join(' ')}`)
        }
    
        return name
    }



    var staticdata = new Map()



    sorters.navn = (a, b) => {
        if (a.etternavn  > b.etternavn)  return  1;
        if (a.etternavn  < b.etternavn)  return -1;

        if (a.fornavn    > b.fornavn)    return  1;
        if (a.fornavn    < b.fornavn)    return -1;

        if (a.mellomnavn > b.mellomnavn) return  1;
        if (a.mellomnavn < b.mellomnavn) return -1;

        if (a.fagkode    > b.fagkode)    return  1;
        if (a.fagkode    < b.fagkode)    return -1;

        return 0
    }



    self['load:xlsx-populate'] = async (fil) => {
        var filedata = {
            errors          : new Set(),
            warnings        : new Set(),

            exceldata       : new Map(),

            romdata         : new Map(),
            lærerdata       : new Map(),
            fagressurser    : new Map(),
            tilgjengelighet : new Map(),
            elevdata        : new Map(),
            gruppedata      : new Map(),
            fagtimer        : new Map(),
        }



        var parse = function (datatype, headers, data) {
            var datamap = new Map();
            headers.forEach((header, i) => datamap.set(header, data[i]));
//            console.log(datamap)

            if (datatype === 'Romdata') {
                var kode   = datamap.get('Kode') || null; kode = (kode ? kode.toString().trim() : null)
                var navn   = datamap.get('Navn') || null; navn = (navn ? navn.toString().trim() : null)

/*
                if (kode.length == 1) kode = '00' + kode
                if (kode.length == 2) kode = '0'  + kode
                if (navn.length == 1) navn = '00' + navn
                if (navn.length == 2) navn = '0'  + navn
*/
                
                if (kode && navn) {
                    filedata.romdata.set(kode, new Map());
                    filedata.romdata.get(kode).set('kode',         kode);
                    filedata.romdata.get(kode).set('navn',         navn);
                    filedata.romdata.get(kode).set('fagtimer',     new Set());
                    filedata.romdata.get(kode).set('tilgjengelig', new Map());
                } else {
                    if (!kode) { filedata.errors.add(new timeplan.error('mangler', 'romdata', 'kode', null, [kode, navn])); }
                    if (!navn) { filedata.errors.add(new timeplan.error('mangler', 'romdata', 'navn', null, [kode, navn])); }
                }
            }

            if (datatype === 'Lærerdata') {
                var kode       = datamap.get('Kode')       || null; kode       = (kode       ?       kode.toString().trim() : null)
                var fornavn    = datamap.get('Fornavn')    || null; fornavn    = (fornavn    ?    fornavn.toString().trim() : null)
                var mellomnavn = datamap.get('Mellomnavn') || null; mellomnavn = (mellomnavn ? mellomnavn.toString().trim() : null)
                var etternavn  = datamap.get('Etternavn')  || null; etternavn  = (etternavn  ?  etternavn.toString().trim() : null)

                if (kode && fornavn && etternavn) {
                    var navn = fornavn + ' ' + (mellomnavn ? mellomnavn + ' ' : '') + etternavn;

                    filedata.lærerdata.set(kode, new Map());
                    filedata.lærerdata.get(kode).set('kode',         kode      );
                    filedata.lærerdata.get(kode).set('navn',         navn      );
                    filedata.lærerdata.get(kode).set('fornavn',      fornavn   );
                    filedata.lærerdata.get(kode).set('mellomnavn',   mellomnavn);
                    filedata.lærerdata.get(kode).set('etternavn',    etternavn );
                    filedata.lærerdata.get(kode).set('fagtimer',     new Set() );
                    filedata.lærerdata.get(kode).set('tilgjengelig', new Map());
                } else {
                    if (!kode)      { filedata.errors.add(new timeplan.error('mangler', 'lærerdata', 'kode',      null, [kode, fornavn, mellomnavn, etternavn])); }
                    if (!fornavn)   { filedata.errors.add(new timeplan.error('mangler', 'lærerdata', 'fornavn',   null, [kode, fornavn, mellomnavn, etternavn])); }
                    if (!etternavn) { filedata.errors.add(new timeplan.error('mangler', 'lærerdata', 'etternavn', null, [kode, fornavn, mellomnavn, etternavn])); }
                }
            }

            if (datatype === 'Fagressurser') {
                var kode       = datamap.get('Kode')     || null; kode       = (kode       ?       kode.toString().trim() : null)
                var navn       = datamap.get('Navn')     || null; navn       = (navn       ?       navn.toString().trim() : null)
                var varighet   = datamap.get('Varighet') || null;                                                                
                var romliste   = datamap.get('Rom')      || null; romliste   = (romliste   ?   romliste.toString().trim() : null)
                var lærerliste = datamap.get('Lærere')   || null; lærerliste = (lærerliste ? lærerliste.toString().trim() : null)

                if (romliste)   { romliste   = romliste.split(' ');   }
                if (lærerliste) { lærerliste = lærerliste.split(' '); }

                if (kode && navn) {
                    filedata.fagressurser.set(kode, new Map());
                    filedata.fagressurser.get(kode).set('kode',       kode);
                    filedata.fagressurser.get(kode).set('navn',       navn);
                    filedata.fagressurser.get(kode).set('varighet',   varighet);
                    filedata.fagressurser.get(kode).set('romliste',   romliste);
                    filedata.fagressurser.get(kode).set('lærerliste', lærerliste);
                } else {
                    if (!kode) { filedata.errors.add(new timeplan.error('mangler', 'fagressurser', 'kode', null, [kode, navn, varighet, romliste, lærerliste])); }
                    if (!navn) { filedata.errors.add(new timeplan.error('mangler', 'fagressurser', 'navn', null, [kode, navn, varighet, romliste, lærerliste])); }
                }
            }

            if (datatype === 'Tilgjengelighet') {
                var dag         = datamap.get('Dag')         || null; dag         = (dag         ?         dag.toString().trim() : null)
                var dagtime     = datamap.get('Time')        || null; dagtime     = (dagtime     ?     dagtime.toString().trim() : null)
                var gruppeliste = datamap.get('Elevgrupper') || null; gruppeliste = (gruppeliste ? gruppeliste.toString().trim() : null)
                var romliste    = datamap.get('Rom')         || null; romliste    = (romliste    ?    romliste.toString().trim() : null)
                var lærerliste  = datamap.get('Lærere')      || null; lærerliste  = (lærerliste  ?  lærerliste.toString().trim() : null)

                if (gruppeliste) { gruppeliste = gruppeliste.split(' '); }
                if (romliste)    { romliste    = romliste.split(' ');    }
                if (lærerliste)  { lærerliste  = lærerliste.split(' ');  }

                if (dag && dagtime) {
                    var tid = dag + '-' + dagtime;
                    if (filedata.tilgjengelighet.has(tid) === false) {
                        filedata.tilgjengelighet.set(tid, new Map());
                        filedata.tilgjengelighet.get(tid).set('dag',         dag        );
                        filedata.tilgjengelighet.get(tid).set('dagtime',     dagtime    );
                        filedata.tilgjengelighet.get(tid).set('gruppeliste', gruppeliste);
                        filedata.tilgjengelighet.get(tid).set('romliste',    romliste   );
                        filedata.tilgjengelighet.get(tid).set('lærerliste',  lærerliste );
                    }
                } else {
                    if (!dag)     { filedata.errors.add(new timeplan.error('mangler', 'tilgjengelighet', 'dag',  null, [dag, dagtime, gruppeliste, romliste, lærerliste])); }
                    if (!dagtime) { filedata.errors.add(new timeplan.error('mangler', 'tilgjengelighet', 'time', null, [dag, dagtime, gruppeliste, romliste, lærerliste])); }
                }
            }

            if (datatype === 'Elevdata') {
                var fornavn         = datamap.get('Fornavn')         || null; fornavn         = (fornavn         ?         fornavn.toString().trim() : null)
                var mellomnavn      = datamap.get('Mellomnavn')      || null; mellomnavn      = (mellomnavn      ?      mellomnavn.toString().trim() : null)
                var etternavn       = datamap.get('Etternavn')       || null; etternavn       = (etternavn       ?       etternavn.toString().trim() : null)
                var gruppekode      = datamap.get('Gruppekode')      || null; gruppekode      = (gruppekode      ?      gruppekode.toString().trim() : null)
                var klasse          = datamap.get('Klasse')          || null; klasse          = (klasse          ?          klasse.toString().trim() : null)
                var teori           = datamap.get('Teori')           || null; teori           = (teori           ?           teori.toString().trim() : null)
                var norsk           = datamap.get('Norsk')           || null; norsk           = (norsk           ?           norsk.toString().trim() : null)
                var sjanger         = datamap.get('Sjanger')         || null; sjanger         = (sjanger         ?         sjanger.toString().trim() : null)
                var samspill        = datamap.get('Samspill')        || null; samspill        = (samspill        ?        samspill.toString().trim() : null)
                var hovedinstrument = datamap.get('Hovedinstrument') || null; hovedinstrument = (hovedinstrument ? hovedinstrument.toString().trim() : null)
                var biinstrument1   = datamap.get('Biinstrument')    || null; biinstrument1   = (biinstrument1   ?   biinstrument1.toString().trim() : null)
                var biinstrument2   = datamap.get('Biinstrument 2')  || null; biinstrument2   = (biinstrument2   ?   biinstrument2.toString().trim() : null)
                var valgfag1        = datamap.get('Valgfag 1')       || null; valgfag1        = (valgfag1        ?        valgfag1.toString().trim() : null)
                var valgfag2        = datamap.get('Valgfag 2')       || null; valgfag2        = (valgfag2        ?        valgfag2.toString().trim() : null)
                var valgfag3        = datamap.get('Valgfag 3')       || null; valgfag3        = (valgfag3        ?        valgfag3.toString().trim() : null)
                var ekstragrupper   = datamap.get('Ekstragrupper')   || null; ekstragrupper   = (ekstragrupper   ?   ekstragrupper.toString().trim() : null)

                if (ekstragrupper) { ekstragrupper = ekstragrupper.split(' '); }

                if (fornavn && etternavn && klasse) {
                    var navn       = fornavn + ' ' + etternavn;
                    var fulltnavn  = fornavn + ' ' + (mellomnavn ? mellomnavn + ' ' : '') + etternavn;
                    var navneliste = utilities.namelist({first: fornavn, last: etternavn, middle: mellomnavn})

                    if (filedata.elevdata.has(navn) === false) {
                        filedata.elevdata.set(navn, new Map());
                        filedata.elevdata.get(navn).set('navn',            navn           );
                        filedata.elevdata.get(navn).set('fornavn',         fornavn        );
                        filedata.elevdata.get(navn).set('mellomnavn',      mellomnavn     );
                        filedata.elevdata.get(navn).set('etternavn',       etternavn      );
                        filedata.elevdata.get(navn).set('fulltnavn',       fulltnavn      );
                        filedata.elevdata.get(navn).set('navneliste',      navneliste     );
                        filedata.elevdata.get(navn).set('gruppekode',      gruppekode     );
                        filedata.elevdata.get(navn).set('klasse',          klasse         );
                        filedata.elevdata.get(navn).set('teori',           teori          );
                        filedata.elevdata.get(navn).set('norsk',           norsk          );
                        filedata.elevdata.get(navn).set('sjanger',         sjanger        );
                        filedata.elevdata.get(navn).set('samspill',        samspill       );
                        filedata.elevdata.get(navn).set('hovedinstrument', hovedinstrument);
                        filedata.elevdata.get(navn).set('biinstrument 1',  biinstrument1  );
                        filedata.elevdata.get(navn).set('biinstrument 2',  biinstrument2  );
                        filedata.elevdata.get(navn).set('valgfag 1',       valgfag1       );
                        filedata.elevdata.get(navn).set('valgfag 2',       valgfag2       );
                        filedata.elevdata.get(navn).set('valgfag 3',       valgfag3       );
                        filedata.elevdata.get(navn).set('ekstragrupper',   ekstragrupper  );
                        filedata.elevdata.get(navn).set('grupper',         new Set()      );
                        filedata.elevdata.get(navn).set('fagtimer',        new Set()      );
                        filedata.elevdata.get(navn).set('gruppetimer',     new Set()      );
                        filedata.elevdata.get(navn).set('tilgjengelig',    new Map()      );
                    }

                    var firstrepeating = headers.findIndex((t) => t == 'Fag')
                    data = data.slice(firstrepeating)

                    while (data.length > 0) {
                        var id         = 'f' + filedata.fagtimer.size;
                        var fag        = data.shift() || null; fag        = (fag        ?        fag.toString().trim() : null)
                        var lærerliste = data.shift() || null; lærerliste = (lærerliste ? lærerliste.toString().trim() : null)
                        var romliste   = data.shift() || null; romliste   = (romliste   ?   romliste.toString().trim() : null)
                        var dag        = data.shift() || null; dag        = (dag        ?        dag.toString().trim() : null)
                        var dagtime    = data.shift() || null; dagtime    = (dagtime    ?    dagtime.toString().trim() : null)

                        lærerliste = lærerliste ? lærerliste.split(' ') : [];
                        romliste   = romliste   ? romliste.split(' ')   : [];

                        if (fag) {
                            var fagtime = new Map();
                            fagtime.set('id',            id        );
                            fagtime.set('type',          'elev'    );
                            fagtime.set('navn',          navn      );
                            fagtime.set('fag',           fag       );
                            fagtime.set('lærerliste',    lærerliste);
                            fagtime.set('romliste',      romliste  );
                            fagtime.set('dag',           dag       );
                            fagtime.set('dagtime',       dagtime   );

                            filedata.fagtimer.set(id, fagtime);
                            filedata.elevdata.get(navn).get('fagtimer').add(id);
                        }
                    }
                } else {
                    if (!fornavn)   { filedata.errors.add(new timeplan.error('mangler', 'elevdata', 'fornavn',   null, [fornavn, etternavn, klasse, teori, norsk])); }
                    if (!etternavn) { filedata.errors.add(new timeplan.error('mangler', 'elevdata', 'etternavn', null, [fornavn, etternavn, klasse, teori, norsk])); }
                    if (!klasse)    { filedata.errors.add(new timeplan.error('mangler', 'elevdata', 'klasse',    null, [fornavn, etternavn, klasse, teori, norsk])); }
                }
            }

            if (datatype === 'Gruppedata') {
                var navn = datamap.get('Navn') || null; navn = (navn ? navn.toString().trim() : null)

                if (navn) {
                    if (filedata.gruppedata.has(navn) === false) {
                        filedata.gruppedata.set(navn, new Map());
                        filedata.gruppedata.get(navn).set('navn',         navn     );
                        filedata.gruppedata.get(navn).set('elever',       new Set());
                        filedata.gruppedata.get(navn).set('grupper',      new Set([navn]));
                        filedata.gruppedata.get(navn).set('fagtimer',     new Set());
                        filedata.gruppedata.get(navn).set('tilgjengelig', new Map());
                    }

                    var firstrepeating = headers.findIndex((t) => t == 'Fag')
                    data = data.slice(firstrepeating)

                    while (data.length > 0) {
                        var id         = 'f' + filedata.fagtimer.size;
                        var fag        = data.shift() || null; fag        = (fag        ?        fag.toString().trim() : null)
                        var lærerliste = data.shift() || null; lærerliste = (lærerliste ? lærerliste.toString().trim() : null)
                        var romliste   = data.shift() || null; romliste   = (romliste   ?   romliste.toString().trim() : null)
                        var dag        = data.shift() || null; dag        = (dag        ?        dag.toString().trim() : null)
                        var dagtime    = data.shift() || null; dagtime    = (dagtime    ?    dagtime.toString().trim() : null)

/*
                        if (romliste.length == 1) romliste = '00' + romliste
                        if (romliste.length == 2) romliste = '0'  + romliste
*/
                
                        lærerliste = lærerliste ? lærerliste.split(' ') : [];
                        romliste   = romliste   ? romliste.split(' ')   : [];

                        if (fag) {
                            var fagtime = new Map();
                            fagtime.set('id',            id        );
                            fagtime.set('type',          'gruppe'  );
                            fagtime.set('navn',          navn      );
                            fagtime.set('fag',           fag       );
                            fagtime.set('lærerliste',    lærerliste);
                            fagtime.set('romliste',      romliste  );
                            fagtime.set('dag',           dag       );
                            fagtime.set('dagtime',       dagtime   );

                            filedata.fagtimer.set(id, fagtime);
                            filedata.gruppedata.get(navn).get('fagtimer').add(id);
                        }
                    }
                } else {
                    if (!navn) { filedata.errors.add(new timeplan.error('mangler', 'gruppedata', 'navn', null, [navn, fag, lærerliste, romliste, dag, dagtime])); }
                }
            }
        }



        let workbook = await XlsxPopulate.fromDataAsync(fil)
        for (var sheet of ['Romdata', 'Lærerdata', 'Fagressurser', 'Tilgjengelighet', 'Elevdata', 'Gruppedata']) {
            var data = workbook.sheet(sheet).usedRange().value();
            var widths = []
            var aligns = []

            var [start, end] = [workbook.sheet(sheet).usedRange()._startCell._columnNumber, workbook.sheet(sheet).usedRange()._endCell._columnNumber]
            for (var col = start; col <= end; col++) {
                var width = workbook.sheet(sheet).column(col).width()
                var align = workbook.sheet(sheet).column(col).style('horizontalAlignment')

                widths.push(width)
                aligns.push(align)
            }

            filedata.exceldata.set(sheet, new Map())
            filedata.exceldata.get(sheet).set('widths', widths)
            filedata.exceldata.get(sheet).set('aligns', aligns)

            var headers = data.shift()

            for (var linje of data) {
                parse(sheet, headers, linje)
            }
        }

        return filedata
    }



    self['save:xlsx-populate'] = function (filedata) {
        XlsxPopulate.fromBlankAsync().then(workbook => {
            var staticdata = [
                ['Romdata',         ['Kode', 'Navn']],
                ['Lærerdata',       ['Kode', 'Fornavn', 'Mellomnavn', 'Etternavn']],
                ['Fagressurser',    ['Kode', 'Navn', 'Varighet', 'Rom', 'Lærere']],
                ['Tilgjengelighet', ['Dag', 'Time', 'Elevgrupper', 'Rom', 'Lærere']],
                ['Elevdata',        ['Fornavn', 'Mellomnavn', 'Etternavn', 'Gruppekode', 'Klasse', 'Teori', 'Norsk', 'Sjanger', 'Samspill', 'Hovedinstrument', 'Biinstrument', 'Biinstrument 2', 'Valgfag 1', 'Valgfag 2', 'Valgfag 3', 'Ekstragrupper', 'Fag', 'Lærer', 'Rom', 'Dag', 'Time', 'Fag', 'Lærer', 'Rom', 'Dag', 'Time', 'Fag', 'Lærer', 'Rom', 'Dag', 'Time']],
                ['Gruppedata',      ['Navn', 'Fag', 'Lærer', 'Rom', 'Dag', 'Time']],
            ]

            for (var [sheet, headers] of staticdata) {
                workbook.addSheet(sheet)
                workbook.sheet(sheet).range(1, 1, 1, headers.length).value([headers])
                workbook.sheet(sheet).range(1, 1, 1, headers.length).style('bottomBorder', true)
                workbook.sheet(sheet).row(1).style('bold', true);

                for (var col = 1; col <= headers.length; col++) {
                    workbook.sheet(sheet).column(col).style('fill', 'ffffff')
                }
                workbook.sheet(sheet).range(1, 1, 1, headers.length).style('bold', true)
                workbook.sheet(sheet).range(1, 1, 1, headers.length).style('fill', 'eeeeff')
                workbook.sheet(sheet).column(headers.length).style('rightBorder', true)

                if (filedata && filedata.exceldata && filedata.exceldata.get(sheet)) {
                    var widths = filedata.exceldata.get(sheet).get('widths')
                    var aligns = filedata.exceldata.get(sheet).get('aligns')

                    var col = 1
                    for (var width of widths) {
                        workbook.sheet(sheet).column(col).width(width)
                        col++
                    }

                    var col = 1
                    for (var align of aligns) {
                        workbook.sheet(sheet).column(col).style('horizontalAlignment', align)
                        col++
                    }
                }
            }
            workbook.deleteSheet('Sheet1')



            if (filedata.fagtimer !== null) {
                var row = 1
                for (var rom of filedata.romdata) {
                    row += 1; var col = 1;

                    workbook.sheet('Romdata').row(row).cell(col).value(rom[1].get('kode') || ''); col++;
                    workbook.sheet('Romdata').row(row).cell(col).value(rom[1].get('navn') || ''); col++;
                }
    
                var row = 1
                for (var lærer of filedata.lærerdata) {
                    row += 1; var col = 1;

                    workbook.sheet('Lærerdata').row(row).cell(col).value(lærer[1].get('kode')       || ''); col++;
                    workbook.sheet('Lærerdata').row(row).cell(col).value(lærer[1].get('fornavn')    || ''); col++;
                    workbook.sheet('Lærerdata').row(row).cell(col).value(lærer[1].get('mellomnavn') || ''); col++;
                    workbook.sheet('Lærerdata').row(row).cell(col).value(lærer[1].get('etternavn')  || ''); col++;
                }
    
                var row = 1
                for (var [_, fag] of filedata.fagressurser) {
                    row += 1; var col = 1;
    
                    var varighet   = fag.get('varighet');
                    var romliste   = fag.get('romliste');
                    var lærerliste = fag.get('lærerliste');
    
                    if (romliste)   { romliste   = romliste.join(' ');   }
                    if (lærerliste) { lærerliste = lærerliste.join(' '); }
    
                    workbook.sheet('Fagressurser').row(row).cell(col).value(fag.get('kode') || ''); col++;
                    workbook.sheet('Fagressurser').row(row).cell(col).value(fag.get('navn') || ''); col++;
                    workbook.sheet('Fagressurser').row(row).cell(col).value(varighet        || ''); col++;
                    workbook.sheet('Fagressurser').row(row).cell(col).value(romliste        || ''); col++;
                    workbook.sheet('Fagressurser').row(row).cell(col).value(lærerliste      || ''); col++;
                }

                var row = 1
                for (var [_, tid] of filedata.tilgjengelighet) {
                    row += 1; var col = 1;
    
                    var gruppeliste = tid.get('gruppeliste');
                    var romliste    = tid.get('romliste');
                    var lærerliste  = tid.get('lærerliste');
    
                    if (gruppeliste) { gruppeliste = gruppeliste.join(' '); }
                    if (romliste)    { romliste    = romliste.join(' ');    }
                    if (lærerliste)  { lærerliste  = lærerliste.join(' ');  }
    
                    workbook.sheet('Tilgjengelighet').row(row).cell(col).value(tid.get('dag')     || ''); col++;
                    workbook.sheet('Tilgjengelighet').row(row).cell(col).value(tid.get('dagtime') || ''); col++;
                    workbook.sheet('Tilgjengelighet').row(row).cell(col).value(gruppeliste        || ''); col++;
                    workbook.sheet('Tilgjengelighet').row(row).cell(col).value(romliste           || ''); col++;
                    workbook.sheet('Tilgjengelighet').row(row).cell(col).value(lærerliste         || ''); col++;
                }

                var row = 1
                for (var [_, elev] of filedata.elevdata) {
                    row += 1; var col = 1;
    
                    var ekstragrupper = elev.get('ekstragrupper');
                    if (ekstragrupper) { ekstragrupper = ekstragrupper.join(' '); }

                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('fornavn')         || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('mellomnavn')      || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('etternavn')       || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('gruppekode')      || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('klasse')          || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('teori')           || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('norsk')           || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('sjanger')         || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('samspill')        || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('hovedinstrument') || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('biinstrument 1')  || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('biinstrument 2')  || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('valgfag 1')       || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('valgfag 2')       || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(elev.get('valgfag 3')       || ''); col++;
                    workbook.sheet('Elevdata').row(row).cell(col).value(ekstragrupper               || ''); col++;

                    for (var id of elev.get('fagtimer')) {
    
                        var fagtime = filedata.fagtimer.get(id);
                        var romliste   = fagtime.get('romliste');
                        var lærerliste = fagtime.get('lærerliste');
    
                        if (romliste)   { romliste   = romliste.join(' ');   }
                        if (lærerliste) { lærerliste = lærerliste.join(' '); }
    
                        workbook.sheet('Elevdata').row(row).cell(col).value(fagtime.get('fag')     || ''); col++;
                        workbook.sheet('Elevdata').row(row).cell(col).value(lærerliste             || ''); col++;
                        workbook.sheet('Elevdata').row(row).cell(col).value(romliste               || ''); col++;
                        workbook.sheet('Elevdata').row(row).cell(col).value(fagtime.get('dag')     || ''); col++;
                        workbook.sheet('Elevdata').row(row).cell(col).value(fagtime.get('dagtime') || ''); col++;
                    }
                }
    
                var row = 1
                for (var [_, gruppe] of filedata.gruppedata) {
                    for (var id of gruppe.get('fagtimer')) {
                        row += 1; var col = 1;
    
                        var fagtime = filedata.fagtimer.get(id);
                        var romliste   = fagtime.get('romliste');
                        var lærerliste = fagtime.get('lærerliste');
    
                        if (romliste)   { romliste   = romliste.join(' ');   }
                        if (lærerliste) { lærerliste = lærerliste.join(' '); }
    
                        workbook.sheet('Gruppedata').row(row).cell(col).value(gruppe.get('navn')     || ''); col++;
                        workbook.sheet('Gruppedata').row(row).cell(col).value(fagtime.get('fag')     || ''); col++;
                        workbook.sheet('Gruppedata').row(row).cell(col).value(lærerliste             || ''); col++;
                        workbook.sheet('Gruppedata').row(row).cell(col).value(romliste               || ''); col++;
                        workbook.sheet('Gruppedata').row(row).cell(col).value(fagtime.get('dag')     || ''); col++;
                        workbook.sheet('Gruppedata').row(row).cell(col).value(fagtime.get('dagtime') || ''); col++;
                    }
                }
            }


            return workbook.outputAsync()
        }).then(blob => {
            var filename = 'timeplan - ' + utilities.timestamp() + '.xlsx'
            saveAs(blob, filename)
        }).catch(error => {
            console.log(error)
        });
    }



    self['publish:jspdf'] = (function (filedata) {
        var self = {
            // PRIVATE:
            'complete':          function () { console.log('UNDEFINED FUNCTION: file.publish.complete()');          },
            'individual':        function () { console.log('UNDEFINED FUNCTION: file.publish.individual()');        },

            // PUBLIC:
            'publish':           function () { console.log('UNDEFINED FUNCTION: file.publish.publish()');           },
        }



        var shared = {
            'data':              {},
            'getDato':           function () { console.log('UNDEFINED FUNCTION: file.publish.shared.getDato()');    },
            'chooseFont':        function () { console.log('UNDEFINED FUNCTION: file.publish.shared.chooseFont()'); },
            'namefit':           function () { console.log('UNDEFINED FUNCTION: file.publish.shared.namefit()');    },
        }

        shared.data = {
            'k':              (72 / 25.4000508),
            'dager':          ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag'],
            'timer':          [['3', '10:25-11:10'], ['4', '11:15-12:00'], ['5', '12:05-12:50'], ['6', '13:00-13:45'], ['7', '13:55-14:40'], ['8', '14:50-15:35'], ['9', '15:45-16:30'], ['10', '16:30-17:15']],
            'availablefonts': (function () { var doc = new jsPDF(); var result = doc.getFontList(); doc = null; return result })(),
        }

        shared.getDato = function () {
            var tidspunkt = new Date();
            var dag       = tidspunkt.getDate()
            var måned     = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'][tidspunkt.getMonth()];
            var år        = tidspunkt.getFullYear()
            return dag + '. ' + måned + ' ' + år;
        }

        shared.chooseFont = function (list) {
            if (list) {
                for (var [face, style] of list) {
                    if (face in shared.data.availablefonts) {
                        var availablestyles = shared.data.availablefonts[face]
                        if (availablestyles.indexOf(style) !== -1) {
                            return { 'face': face, 'style': style }
                        }
                    }
                }
            }

            return { 'face': 'helvetica', 'style': 'normal' }
        }

        shared.namefit = (doc, namelist, max) => {
            for (const name of namelist) {
                const width = doc.getTextWidth(name);
                if (width <= max) return name
            }
        
            return namelist[namelist.length-1]
        }



        self.complete = (function () {
            var self = {
                'prepare':  function () { console.log('UNDEFINED FUNCTION: file.publish.complete.prepare()');  },
                'generate': function () { console.log('UNDEFINED FUNCTION: file.publish.complete.generate()'); },
                'complete': function () { console.log('UNDEFINED FUNCTION: file.publish.complete.complete()'); },
            }



            self.prepare = function (filedata) {
                var data      = new Map()
                var timeliste = new Map()

                for (var [fid, fagtime] of filedata.fagtimer) {
                    var dag        = fagtime.get('dag')
                    var dagtime    = fagtime.get('dagtime')

                    if (dag && dagtime) {
                        var tid        = dag + '-' + dagtime;
                        var timetype   = fagtime.get('type');
                        var navn       = fagtime.get('navn');
                        var fagkode    = fagtime.get('fag');
                        var varighet   = filedata.fagressurser.get(fagkode).get('varighet')
                        var span       = Math.ceil(varighet / 45)
                        var lærerliste = fagtime.get('lærerliste');
                        var romliste   = fagtime.get('romliste')

                        var navneliste = [navn]

                        if (timetype == 'elev') {
                            var elev   = filedata.elevdata.get(navn)
                            navneliste = elev.get('navneliste')
                        }

                        var A          = romliste[0]   || '';
                        var B          = lærerliste[0] || '';
                        var C          = fagkode       || '';
                        var D          = new Set();

                        for (var i = 0; i < span; i++) {
                            var t = dag + '-' + (parseInt(dagtime) + i)

                            if (timeliste.has(t) === false) {
                                timeliste.set(t, new Map());
                            }

                            var key = A + '/' + B + '/' + C;
                            if (timeliste.get(t).has(key) === false) {
                                timeliste.get(t).set(key, new Map());
                                timeliste.get(t).get(key).set('style', timetype);
                                timeliste.get(t).get(key).set('span',  span);
                                timeliste.get(t).get(key).set('A',     A);
                                timeliste.get(t).get(key).set('B',     B);
                                timeliste.get(t).get(key).set('C',     C);
                                timeliste.get(t).get(key).set('D',     new Set());
                            }

                            timeliste.get(t).get(key).get('D').add(navneliste);
                        }
                    }
                }

                var timedata = {}

                for (var dag in shared.data.dager) {
                    for (var time in shared.data.timer) {
                        var tid = shared.data.dager[dag] + '-' + shared.data.timer[time][0]

                        var time = timeliste.get(tid)
                        if (time) {
                            timedata[tid] = {
                                'data': [],
                            }

                            for (var [key, t] of time) {
                                timedata[tid].data.push({
                                    style: t.get('style'),
                                    A:     t.get('A'),
                                    B:     t.get('B'),
                                    C:     t.get('C'),
                                    D:     [...t.get('D')],
                                })
                            }

                            for (var [key, t] of time) {
                                timedata[tid].data.sort(function (a, b) {
                                    if (a.A < b.A) { return -1 }
                                    if (a.A > b.A) { return 1  }
                                    return 0
                                })
                            }
                        }
                    }
                }

                data.set('timedata', timedata)
                return data
            }

            self.generate = function (data) {
                var font = {
                    'header':  shared.chooseFont(),
                    'versjon': shared.chooseFont(),
                    'dag':     shared.chooseFont(),
                    'time':    shared.chooseFont(),
                    'tid':     shared.chooseFont(),
                    'A':       shared.chooseFont(),
                    'B':       shared.chooseFont(),
                    'C':       shared.chooseFont(),
                    'D':       shared.chooseFont(),
                }

                var fontsize = {
                    'header':  14.0,
                    'versjon':  7.0,
                    'dag':     10.0,
                    'time':    10.0,
                    'tid':      7.0,
                    'A':        6.0,
                    'B':        6.0,
                    'C':        6.0,
                    'D':        6.0,
                }

                var textcolor = {
                    'header':  '#000000',
                    'versjon': '#cccccc',
                    'dag':     '#000000',
                    'time':    '#000000',
                    'tid':     '#888888',
                    'A':       '#000000',
                    'B':       '#000000',
                    'C':       '#000000',
                    'D':       '#000000',
                }

                var frameborder = {
                    'default': { 'C': '0.0', 'M': '0.0', 'Y': '0.0', 'K': '0.2'},
                }

                var setfont = function (doc, style) {
                    if (style in font)      { doc.setFont(font[style]['face'], font[style]['style'])}
                    if (style in fontsize)  { doc.setFontSize(fontsize[style])   }
                    if (style in textcolor) { doc.setTextColor(textcolor[style]) }
                }

                var setframe = function (doc, style) {
                    if (style in frameborder) { doc.setDrawColor(frameborder[style].C, frameborder[style].M, frameborder[style].Y, frameborder[style].K) }
                }



                var pos = {}
                pos.w = 54
                pos.h = 49
                pos.l = 297 - (5 * pos.w) - 5
                pos.t = 420 - (8 * pos.h) - 5

                for (var x of [0, 1, 2, 3, 4]) {
                    for (var y of [0, 1, 2, 3, 4, 5, 6, 7]) {
                        var dagtime = shared.data.dager[x] + '-' + shared.data.timer[y][0]
                        pos[dagtime] = {
                            'x': pos.l + x * pos.w,
                            'y': pos.t + y * pos.h,
                        }
                    }
                }

                var doc = new jsPDF({ 'format': 'a3', 'orientation': 'portrait' })

                setfont(doc, 'header');  doc.text('Musikktimeplan for musikklinja', 5,  5 + (fontsize['header']  / shared.data.k))
                setfont(doc, 'versjon'); doc.text('versjon av ' + shared.getDato(),  5, 11 + (fontsize['versjon'] / shared.data.k))

                setfont(doc, 'dag')
                for (var x of [0, 1, 2, 3, 4]) {
                    var posx = pos[shared.data.dager[x]+'-3'].x + (pos.w / 2)
                    var posy = pos.t - (fontsize['dag'] / shared.data.k) + 2

                    doc.text(shared.data.dager[x], posx, posy, null, null, 'center')
                }

                for (var y of [0, 1, 2, 3, 4, 5, 6, 7]) {
                    var posx = pos.l - 2
                    var posy = pos['mandag-' + shared.data.timer[y][0]].y + (pos.h / 2) + 4

                    setfont(doc, 'time'); doc.text(shared.data.timer[y][0] + '.time', posx, posy - (fontsize['time'] / shared.data.k), null, null, 'right')
                    setfont(doc, 'tid');  doc.text(shared.data.timer[y][1], posx, posy, null, null, 'right')
                }

                setframe(doc, 'default')
                for (var x of [0, 1, 2, 3, 4]) {
                    for (var y of [0, 1, 2, 3, 4, 5]) {
                        var dagtime = shared.data.dager[x] + '-' + shared.data.timer[y][0]
                        doc.rect(pos[dagtime].x, pos[dagtime].y, pos.w, pos.h, 'S')
                    }
                }



                for (var dagtime in data.get('timedata')) {
                    var timeliste = data.get('timedata')[dagtime].data

                    var coord = {}
                    coord.margin = { top: 0.5,                              bottom: 0.5,                        left: 1.00,                                                 right: 1.00                                                 }
                    coord.frame  = { x:   pos[dagtime].x,                   y:      pos[dagtime].y,             w:    pos.w,                                                h:     pos.h                                                }
                    coord.cell   = { x:   coord.frame.x,                    y:      coord.frame.y,              w:    coord.frame.w,                                        h:     coord.frame.h                                        }
                    coord.text   = { x:   coord.cell.x + coord.margin.left, y: coord.cell.y + coord.margin.top, w: coord.cell.w - (coord.margin.left + coord.margin.right), h: coord.cell.h - (coord.margin.top  + coord.margin.bottom) }

                    for (var time in timeliste) {
                        var timedata = timeliste[time]

                        var posxA = coord.text.x
                        var posxB = posxA +  5.5
                        var posxC = posxB +  7.0
                        var posxD = posxC + 13.0

                        var posyA = coord.text.y + (fontsize.A / shared.data.k)
                        var posyB = posyA
                        var posyC = posyA
                        var posyD = posyA

                        setfont(doc, 'A'); doc.text(timedata.A, posxA, posyA)
                        setfont(doc, 'B'); doc.text(timedata.B, posxB, posyB)
                        setfont(doc, 'C'); doc.text(timedata.C, posxC, posyC)

                        setfont(doc, 'D');
                        for (var line of timedata.D) {
                            name = shared.namefit(doc, line, 27)

                            doc.text(name, posxD, posyD)
                            coord.text.y += (fontsize.D / shared.data.k)
                            var posyD = coord.text.y + (fontsize.A / shared.data.k)
                        }

                        coord.text.y += 0.7
                    }

                    setframe(doc, 'default')
                    doc.rect(coord.frame.x, coord.frame.y, coord.frame.w, coord.frame.h, 'S')
                }



                return doc.output('blob')
            }



            self.complete = function (filedata) {
                var data = self.prepare(filedata)
                return self.generate(data)
            }



            return self.complete
        })();



        self.individual = (function () {
            var self = {
                'prepare':    function () { console.log('UNDEFINED FUNCTION: file.publish.individual.prepare()');    },
                'generate':   function () { console.log('UNDEFINED FUNCTION: file.publish.individual.generate()');   },
                'individual': function () { console.log('UNDEFINED FUNCTION: file.publish.individual.individual()'); },
            }



            self.prepare = function (filedata, type, id) {
                var data      = new Map()
                var timeliste = new Map()



                switch (type) {
                    case 'rom':
                        var rom = filedata.romdata.get(id)
                        data.set('header', rom.get('navn'))

                        for (var fid of filedata.romdata.get(id).get('fagtimer')) {
                            var fagtime = filedata.fagtimer.get(fid);
                            var dag     = fagtime.get('dag');
                            var dagtime = fagtime.get('dagtime');

                            if (dag && dagtime) {
                                var tid        = dag + '-' + dagtime;
                                var timetype   = fagtime.get('type');
                                var navn       = fagtime.get('navn');
                                var fagkode    = fagtime.get('fag');
                                var varighet   = filedata.fagressurser.get(fagkode).get('varighet')
                                var span       = Math.ceil(varighet / 45)
                                var lærerliste = fagtime.get('lærerliste');
                                var trinn      = null;

                                var A          = fagkode    || '';
                                var B          = lærerliste || '';

                                if (timetype === 'elev')   { trinn     = filedata.elevdata.get(navn).get('trinn'); }
                                if (timetype === 'gruppe') { trinn     = filedata.gruppedata.get(navn).get('trinn'); }

                                if (timeliste.has(tid) === false) {
                                    timeliste.set(tid, new Map());
                                }

                                var key = fagkode + '/' + trinn + '/' + lærerliste.join(' ');
                                if (timeliste.get(tid).has(key) === false) {
                                    timeliste.get(tid).set(key, new Map());
                                    timeliste.get(tid).get(key).set('style', trinn);
                                    timeliste.get(tid).get(key).set('span',  span);
                                    timeliste.get(tid).get(key).set('A',     A);
                                    timeliste.get(tid).get(key).set('B',     B);
                                    timeliste.get(tid).get(key).set('C',     new Set());
                                }

                                timeliste.get(tid).get(key).get('C').add(navn);
                            }
                        }
                        break;



                    case 'lærer':
                        var lærer = filedata.lærerdata.get(id)
                        data.set('header', lærer.get('navn'))

                        for (var fid of filedata.lærerdata.get(id).get('fagtimer')) {
                            var fagtime = filedata.fagtimer.get(fid);
                            var dag     = fagtime.get('dag');
                            var dagtime = fagtime.get('dagtime');

                            if (dag && dagtime) {
                                var tid        = dag + '-' + dagtime;
                                var timetype   = fagtime.get('type');
                                var navn       = fagtime.get('navn');
                                var fagkode    = fagtime.get('fag');
                                var varighet   = filedata.fagressurser.get(fagkode).get('varighet')
                                var span       = Math.ceil(varighet / 45)
                                var romliste   = fagtime.get('romliste');
                                var trinn      = null;

                                var A          = fagkode;
                                var B          = romliste;

                                if (timetype === 'elev')   { trinn = filedata.elevdata.get(navn).get('trinn'); }
                                if (timetype === 'gruppe') { trinn = filedata.gruppedata.get(navn).get('trinn'); }

                                if (trinn === 'Vg1' || trinn === 'Vg2' || trinn === 'Vg3') {
                                    A += ' (' + trinn + ')'
                                }

                                if (timeliste.has(tid) === false) {
                                    timeliste.set(tid, new Map());
                                }

                                var key = fagkode + '/' + trinn + '/' + romliste.join(' ');
                                if (timeliste.get(tid).has(key) === false) {
                                    timeliste.get(tid).set(key, new Map());
                                    timeliste.get(tid).get(key).set('style', trinn);
                                    timeliste.get(tid).get(key).set('span',  span);
                                    timeliste.get(tid).get(key).set('A',     A);
                                    timeliste.get(tid).get(key).set('B',     B);
                                    timeliste.get(tid).get(key).set('C',     new Set());
                                }

                                timeliste.get(tid).get(key).get('C').add(navn);
                            }
                        }
                        break



                    case 'elev':
                        var elev = filedata.elevdata.get(id);

                        data.set('header', elev.get('fulltnavn') + ' (' + elev.get('klasse') + ')')

                        var fagtimer = new Set([...elev.get('fagtimer'), ...elev.get('gruppetimer')]);

                        for (var id of fagtimer) {
                            var fagtime = filedata.fagtimer.get(id);
                            var dag     = fagtime.get('dag');
                            var dagtime = fagtime.get('dagtime');

                            if (dag && dagtime) {
                                var tid        = dag + '-' + dagtime;
                                var timetype   = fagtime.get('type');
                                var fagkode    = fagtime.get('fag');
                                var varighet   = filedata.fagressurser.get(fagkode).get('varighet')
                                var span       = Math.ceil(varighet / 45)

                                var A          = filedata.fagressurser.get(fagkode).get('navn')
                                var B          = fagtime.get('romliste')
                                var C          = [];

                                for (var lærer of fagtime.get('lærerliste')) { C.push(filedata.lærerdata.get(lærer).get('navn')) }

                                if (timeliste.has(tid) === false) {
                                    timeliste.set(tid, new Map());
                                }

                                var key = A + '/' + B.join(' ') + '/' + C.join(' ');
                                if (timeliste.get(tid).has(key) === false) {
                                    timeliste.get(tid).set(key, new Map());
                                    timeliste.get(tid).get(key).set('style', timetype);
                                    timeliste.get(tid).get(key).set('span',  span);
                                    timeliste.get(tid).get(key).set('A',     A);
                                    timeliste.get(tid).get(key).set('B',     B);
                                    timeliste.get(tid).get(key).set('C',     new Set(C));
                                }
                            }
                        }
                        break
                }



                var timedata = {}

                for (var dag in shared.data.dager) {
                    for (var time in shared.data.timer) {
                        var tid = shared.data.dager[dag] + '-' + shared.data.timer[time][0]

                        var time = timeliste.get(tid)
                        if (time) {
                            timedata[tid] = {
                                'span': 0,
                                'data': [],
                            }

                            for (var [key, t] of time) {
                                timedata[tid].span = Math.max(timedata[tid].span, t.get('span'))

                                timedata[tid].data.push({
                                    style: t.get('style'),
                                    A:     t.get('A'),
                                    B:     t.get('B'),
                                    C:     [...t.get('C')],
                                })
                            }
                        }
                    }
                }

                data.set('timedata', timedata)
                return data
            }



            self.generate = function (data) {
                var font = {
                    'header':  shared.chooseFont(),
                    'versjon': shared.chooseFont(),
                    'dag':     shared.chooseFont(),
                    'time':    shared.chooseFont(),
                    'tid':     shared.chooseFont(),
                    'A':       shared.chooseFont([['helvetica', 'bold']]),
                    'B':       shared.chooseFont([['courier', 'normal']]),
                    'C':       shared.chooseFont(),
                }

                var fontsize = {
                    'header':  14.0,
                    'versjon':  7.0,
                    'dag':     10.0,
                    'time':    10.0,
                    'tid':      7.0,
                    'A':        8.5,
                    'B':        8.4,
                    'C':        7.5,
                }

                var textcolor = {
                    'header':  '#000000',
                    'versjon': '#cccccc',
                    'dag':     '#000000',
                    'time':    '#000000',
                    'tid':     '#888888',
                    'A':       '#000000',
                    'B':       '#000000',
                    'C':       '#000000',
                }

                var frameborder = {
                    'default': { 'C': '0.0', 'M': '0.0', 'Y': '0.0', 'K': '0.2'},
                }

                var framefill = {
                    'default': { 'C': '0.0', 'M': '0.0', 'Y': '0.0', 'K': '0.2'},
                    'elev':    { 'C': '0.1', 'M': '0.0', 'Y': '0.0', 'K': '0.0'},
                    'gruppe':  { 'C': '0.0', 'M': '0.1', 'Y': '0.0', 'K': '0.0'},
                    'Vg1':     { 'C': '0.1', 'M': '0.0', 'Y': '0.0', 'K': '0.0'},
                    'Vg2':     { 'C': '0.0', 'M': '0.1', 'Y': '0.0', 'K': '0.0'},
                    'Vg3':     { 'C': '0.0', 'M': '0.0', 'Y': '0.1', 'K': '0.0'},
                    'multi':   { 'C': '0.1', 'M': '0.1', 'Y': '0.0', 'K': '0.0'},
                    'admin':   { 'C': '0.1', 'M': '0.0', 'Y': '0.1', 'K': '0.0'},
                }

                var setfont = function (doc, style) {
                    if (style in font)      { doc.setFont(font[style]['face'], font[style]['style'])}
                    if (style in fontsize)  { doc.setFontSize(fontsize[style])   }
                    if (style in textcolor) { doc.setTextColor(textcolor[style]) }
                }

                var setframe = function (doc, style) {
                    if (style in frameborder) { doc.setDrawColor(frameborder[style].C, frameborder[style].M, frameborder[style].Y, frameborder[style].K) }
                    if (style in framefill)   { doc.setFillColor(framefill[style].C,   framefill[style].M,   framefill[style].Y,   framefill[style].K)   }
                }



                var pos = {}
                pos.w = 54
                pos.h = 23
                pos.l = 297 - (5 * pos.w) - 5
                pos.t = 210 - (8 * pos.h) - 5

                for (var x of [0, 1, 2, 3, 4]) {
                    for (var y of [0, 1, 2, 3, 4, 5, 6, 7]) {
                        var dagtime = shared.data.dager[x] + '-' + shared.data.timer[y][0]
                        pos[dagtime] = {
                            'x': pos.l + x * pos.w,
                            'y': pos.t + y * pos.h,
                        }
                    }
                }


                var doc = new jsPDF({ 'format': 'a4', 'orientation': 'landscape' })

                setfont(doc, 'header');  doc.text('Musikktimeplan for ' + data.get('header'), 5,  5 + (fontsize['header']  / shared.data.k))
                setfont(doc, 'versjon'); doc.text('versjon av ' + shared.getDato(),  5, 11 + (fontsize['versjon'] / shared.data.k))

                setfont(doc, 'dag')
                for (var x of [0, 1, 2, 3, 4]) {
                    var posx = pos[shared.data.dager[x]+'-3'].x + (pos.w / 2)
                    var posy = pos.t - (fontsize['dag'] / shared.data.k) + 2

                    doc.text(shared.data.dager[x], posx, posy, null, null, 'center')
                }

                for (var y of [0, 1, 2, 3, 4, 5, 6, 7]) {
                    var posx = pos.l - 2
                    var posy = pos['mandag-' + shared.data.timer[y][0]].y + (pos.h / 2) + 4

                    setfont(doc, 'time'); doc.text(shared.data.timer[y][0] + '.time', posx, posy - (fontsize['time'] / shared.data.k), null, null, 'right')
                    setfont(doc, 'tid');  doc.text(shared.data.timer[y][1], posx, posy, null, null, 'right')
                }



                setframe(doc, 'default')
                for (var x of [0, 1, 2, 3, 4]) {
                    for (var y of [0, 1, 2, 3, 4, 5]) {
                        var dagtime = shared.data.dager[x] + '-' + shared.data.timer[y][0]
                        doc.rect(pos[dagtime].x, pos[dagtime].y, pos.w, pos.h, 'S')
                    }
                }



                for (var dagtime in data.get('timedata')) {
                    var timeliste = data.get('timedata')[dagtime].data
                    var timespan  = data.get('timedata')[dagtime].span
                    var timecount = timeliste.length

                    var coord = {}
                    coord.margin = { top: 0.5,            bottom: 0.5,            left: 1.00,          right: 1.00                      }
                    coord.frame  = { x:   pos[dagtime].x, y:      pos[dagtime].y, w:    pos.w,         h:     pos.h * timespan          }
                    coord.cell   = { x:   coord.frame.x,  y:      coord.frame.y,  w:    coord.frame.w, h:     coord.frame.h / timecount }

                    var count = 0
                    for (var time in timeliste) {
                        var timedata = timeliste[time]

                        coord.cell.y = coord.frame.y + (coord.cell.h * count)

                        setframe(doc, timedata['style'])
                        doc.rect(coord.cell.x, coord.cell.y, coord.cell.w, coord.cell.h, 'F')

                        coord.text = {
                            x: coord.cell.x + coord.margin.left,
                            y: coord.cell.y + coord.margin.top,
                            w: coord.cell.w - (coord.margin.left + coord.margin.right),
                            h: coord.cell.h - (coord.margin.top  + coord.margin.bottom),
                        }

                        var lists = {
                            'B': [],
                            'C': [],
                        }

                        var BListMaxCount = Math.floor(coord.text.h / (fontsize.B / shared.data.k))

                        // Balancing the list length
                        var BListCount = Math.ceil(timedata.B.length / BListMaxCount)
                        BListMaxCount = Math.ceil(timedata.B.length / BListCount)

                        setfont(doc, 'B')
                        for (var i = 0; i < timedata.B.length; i += BListMaxCount) {
                            var partlist = timedata.B.slice(i, i+BListMaxCount)
                            var width = 0
                            for (var line of partlist) {
                                width = Math.max(width, doc.getTextWidth(line))
                            }

                            lists.B.push({ 'width': width, 'data': partlist })
                        }

                        setfont(doc, 'C')
                        var CListMaxCount = Math.floor((coord.text.h - (fontsize.A / shared.data.k)) / (fontsize.C / shared.data.k))
                        for (var i = 0; i < timedata.C.length; i += CListMaxCount) {
                            lists.C.push(timedata.C.slice(i, i+CListMaxCount))
                        }



                        var posxA = coord.text.x
                        var posxB = coord.text.x + coord.text.w
                        var posxC = coord.text.x + 1.5

                        var posyA = coord.text.y + (fontsize.A / shared.data.k)
                        var posyB = coord.text.y + (fontsize.B / shared.data.k)
                        var posyC = posyA + (fontsize.C / shared.data.k) + 0.5

                        setfont(doc, 'A'); doc.text(timedata.A, posxA, posyA)

                        setfont(doc, 'B')
                        if (lists.B.length > 0) {
                            var listcount = 0
                            var offset    = 0
                            for (var list of lists.B.reverse()) {
                                var linecount = 0
                                for (var line of list.data) {
                                    doc.text(line, posxB - offset, posyB + linecount * (fontsize.B / shared.data.k), null, null, 'right')
                                    linecount++
                                }
                                listcount++
                                offset += (list.width + 2.0)
                            }
                        }

                        setfont(doc, 'C')
                        if (lists.C.length > 0) {
                            var linecount = 0
                            for (var line of lists.C[0]) {
                                doc.text(line, posxC, posyC + linecount * (fontsize.C / shared.data.k))
                                linecount++
                            }
                        }

                        count++
                    }

                    setframe(doc, 'default')
                    doc.rect(coord.frame.x, coord.frame.y, coord.frame.w, coord.frame.h, 'S')
                }



                return doc.output('blob')
            }



            self.individual = function (filedata, type, id) {
                var data = self.prepare(filedata, type, id)
                return self.generate(data)
            }



            return self.individual
        })();



        self.publish = function (filedata) {
            if (filedata.fagtimer === null) { return null }

            var zip = new JSZip();

            zip.file('timeplan.pdf', self.complete(filedata));

            for (var [_, data] of filedata.romdata) {
                var kode    = data.get('kode');
                var navn    = data.get('navn');

                var contentPDF  = self.individual(filedata, 'rom', kode);
                zip.folder('Rom').file(navn + '.pdf', contentPDF);
            }

            for (var [_, data] of filedata.lærerdata) {
                var kode    = data.get('kode');
                var navn    = data.get('navn');

                var contentPDF  = self.individual(filedata, 'lærer', kode);
                zip.folder('Lærere').file(navn + '.pdf', contentPDF);
            }

            for (var [_, data] of filedata.elevdata) {
                var navn      = data.get('navn'     );
                var fulltnavn = data.get('fulltnavn');
                var trinn     = data.get('trinn'    );

                var contentPDF  = self.individual(filedata, 'elev', navn);
                zip.folder('Elever').folder(trinn).file(fulltnavn + '.pdf', contentPDF);
            }

            var filename = 'timeplan - ' + utilities.timestamp() + '.zip'
            zip.generateAsync({ type: 'blob' }).then(function (blob) { saveAs(blob, filename); });
        }



        return self.publish
    })()



    if (engine.excel == 'xlsx-populate') {
        self.load = self['load:xlsx-populate']
        self.save = self['save:xlsx-populate']
    }

    if (engine.pdf == 'jspdf') {
        self.publish = self['publish:jspdf']
    }



    return {
        'load':    self.load,
        'save':    self.save,
        'publish': self.publish,
    }
})()
