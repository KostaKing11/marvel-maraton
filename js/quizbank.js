/* ============================================================
   quizbank.js  -  pitanja za kviz posle filma / sezone
   ------------------------------------------------------------
   Kljuc = id naslova iz data.json. Svako pitanje je
     [pitanje, TACAN odgovor, netacan, netacan, netacan]
   (redosled odgovora se mesa u kvizu). Kviz bira do 5 pitanja.
   Naslov bez pitanja (ili sa manje od 3) nema kviz.
   ============================================================ */
window.MM = window.MM || {};

window.MM.QUIZ = {

  /* ---------------- MCU filmovi ---------------- */

  'iron-man': [
    ['Ko drži Tonyja Starka zarobljenog u Avganistanu?', 'Deset prstenova', 'Hidra', 'A.I.M.', 'Hammer Industries'],
    ['Ko pomaže Tonyju da u pećini napravi prvo odelo?', 'Yinsen', 'Happy Hogan', 'Obadiah Stane', 'Rhodey'],
    ['Ko je glavni negativac?', 'Obadiah Stane', 'Justin Hammer', 'Ivan Vanko', 'Aldrich Killian'],
    ['Šta Tony kaže novinarima na kraju filma?', '„Ja sam Iron Man.“', '„Ja sam Osvetnik.“', '„Ja nisam heroj.“', '„Odelo sam ja.“'],
    ['Ko čeka Tonyja u sceni posle špice?', 'Nick Fury', 'Phil Coulson', 'Thor', 'Steve Rogers'],
    ['Šta Tonyja drži u životu?', 'Reaktor u grudima', 'Kamen beskonačnosti', 'Vibranijumski čip', 'Serum super-vojnika']
  ],
  'incredible-hulk': [
    ['Ko glumi Brucea Bannera u ovom filmu?', 'Edward Norton', 'Mark Ruffalo', 'Eric Bana', 'Jeremy Renner'],
    ['Ko postaje Abomination?', 'Emil Blonsky', 'Samuel Sterns', 'Thaddeus Ross', 'Glenn Talbot'],
    ['U kojoj zemlji se Bruce krije na početku?', 'Brazil', 'Meksiko', 'Indija', 'Kanada'],
    ['Ko na kraju filma razgovara sa generalom Rossom u baru?', 'Tony Stark', 'Nick Fury', 'Phil Coulson', 'Steve Rogers'],
    ['Kako se zove Bruceova devojka?', 'Betty Ross', 'Jennifer Walters', 'Pepper Potts', 'Jane Foster']
  ],
  'iron-man-2': [
    ['Ko je Whiplash?', 'Ivan Vanko', 'Justin Hammer', 'Aldrich Killian', 'Obadiah Stane'],
    ['Šta polako truje Tonyja?', 'Paladijum iz reaktora', 'Vibranijum', 'Gama zračenje', 'Extremis'],
    ['Ko obuče odelo i postane War Machine?', 'Rhodey', 'Happy', 'Justin Hammer', 'Coulson'],
    ['Gde Whiplash prvi put napada Tonyja?', 'Na trci u Monaku', 'Na Stark Expou', 'U Malibuu', 'U Senatu'],
    ['Ko se krije iza imena „Natalie Rushman“?', 'Natasha Romanoff', 'Maria Hill', 'Peggy Carter', 'Sharon Carter']
  ],
  'thor': [
    ['Zašto Odin proteruje Thora na Zemlju?', 'Napao je Jotunheim', 'Ukrao je Mjolnir', 'Pustio je Lokija', 'Uvredio je Heimdalla'],
    ['Šta Loki saznaje o sebi?', 'Da je Ledeni div', 'Da je Odinov pravi sin', 'Da je Thanosov sin', 'Da je Hela njegova majka'],
    ['Kako se zove naučnica koju Thor upoznaje?', 'Jane Foster', 'Darcy Lewis', 'Betty Ross', 'Christine Palmer'],
    ['Gde Thor pada na Zemlju?', 'U Novom Meksiku', 'U Teksasu', 'U Njujorku', 'U Norveškoj'],
    ['Šta Loki šalje na Zemlju da ubije Thora?', 'Uništitelja (Destroyer)', 'Ledene divove', 'Kursea', 'Fenrisa'],
    ['Ko čuva Bifrost?', 'Heimdall', 'Sif', 'Volstagg', 'Frigga']
  ],
  'captain-america-first-avenger': [
    ['Ko je napravio serum koji Steve dobija?', 'Dr Abraham Erskine', 'Howard Stark', 'Arnim Zola', 'Hank Pym'],
    ['Ko je Red Skull?', 'Johann Schmidt', 'Arnim Zola', 'Helmut Zemo', 'Alexander Pierce'],
    ['Šta Red Skull pokušava da iskoristi?', 'Tesseract', 'Etar', 'Mjolnir', 'Žezlo'],
    ['Ko je napravio Stevov štit?', 'Howard Stark', 'Tony Stark', 'Dr Erskine', 'Peggy Carter'],
    ['Kako se zove agentkinja u koju je Steve zaljubljen?', 'Peggy Carter', 'Sharon Carter', 'Maria Hill', 'Natasha Romanoff'],
    ['Gde se Steve budi na kraju filma?', 'U Njujorku, 70 godina kasnije', 'U Londonu 1945.', 'Na Arktiku', 'U Wakandi']
  ],
  'avengers': [
    ['Čime Loki kontroliše umove?', 'Žezlom', 'Tesseractom', 'Mjolnirom', 'Etrom'],
    ['Koju vojsku Loki dovodi na Zemlju?', 'Chitauri', 'Kree', 'Skrulle', 'Ledene divove'],
    ['Čija smrt ujedinjuje Osvetnike?', 'Agenta Coulsona', 'Nicka Furyja', 'Marije Hill', 'Erika Selviga'],
    ['Šta Hulk uradi Lokiju u Starkovoj kuli?', 'Lupa ga o pod kao krpu', 'Baci ga sa kule', 'Zaključa ga u kavez', 'Pobegne od njega'],
    ['Šta Tony odnese kroz portal?', 'Nuklearnu raketu', 'Mjolnir', 'Lokija', 'Tesseract'],
    ['Ko se pojavi u sceni posle špice?', 'Thanos', 'Ultron', 'Red Skull', 'Malekith']
  ],
  'iron-man-3': [
    ['Ko je pravi negativac?', 'Aldrich Killian', 'Trevor Slattery', 'Justin Hammer', 'Ivan Vanko'],
    ['Ko je zapravo „Mandarin“ sa televizije?', 'Glumac Trevor Slattery', 'Aldrich Killian', 'Wenwu', 'Justin Hammer'],
    ['Kako se zove program koji ljude pretvara u „vatrene“ vojnike?', 'Extremis', 'Projekat Uvid', 'Serum super-vojnika', 'Weapon X'],
    ['Kako se zove dečak koji pomaže Tonyju u Tenesiju?', 'Harley', 'Peter', 'Ned', 'Morgan'],
    ['Šta Tony baci u more na kraju filma?', 'Stari reaktor iz grudi', 'Svoja odela', 'Mjolnir', 'Kacigu Mandarina']
  ],
  'thor-dark-world': [
    ['Ko je glavni negativac?', 'Malekith', 'Hela', 'Surtur', 'Laufey'],
    ['Šta je Etar zapravo?', 'Kamen stvarnosti', 'Kamen moći', 'Kamen uma', 'Kamen prostora'],
    ['Ko umire štiteći Jane?', 'Frigga', 'Odin', 'Heimdall', 'Sif'],
    ['U kom gradu je završna bitka?', 'U Londonu (Grinič)', 'U Njujorku', 'U Oslu', 'U Parizu'],
    ['Ko na kraju sedi na Odinovom prestolu?', 'Loki prerušen u Odina', 'Thor', 'Heimdall', 'Frigga']
  ],
  'winter-soldier': [
    ['Ko je Winter Soldier?', 'Bucky Barnes', 'Brock Rumlow', 'Sam Wilson', 'Alexander Pierce'],
    ['Šta Hidra planira sa novim helikarijerima?', 'Da ubije milione „pretnji“ odjednom', 'Da napadne Asgard', 'Da ukrade Tesseract', 'Da uništi Wakandu'],
    ['Ko je Alexander Pierce?', 'Vođa Hidre unutar S.H.I.E.L.D.-a', 'Direktor CIA', 'Starkov partner', 'Senator'],
    ['Koji novi saveznik se pridružuje Capu?', 'Falcon', 'War Machine', 'Hawkeye', 'Ant-Man'],
    ['Ko je bila Stevova „komšinica“?', 'Sharon Carter', 'Maria Hill', 'Natasha', 'Peggy Carter']
  ],
  'guardians': [
    ['Šta Peter Quill ukrade na planeti Morag?', 'Kuglu sa kamenom moći', 'Tesseract', 'Etar', 'Žezlo'],
    ['Ko je glavni negativac?', 'Ronan', 'Thanos', 'Yondu', 'Ego'],
    ['U kom zatvoru se tim upoznaje?', 'Kyln', 'Raft', 'Sakaar', 'Vormir'],
    ['Kako Quill odvlači pažnju Ronanu na kraju?', 'Izazove ga na ples', 'Zapeva', 'Pokloni mu kasetu', 'Ispriča mu vic'],
    ['Koju jedinu rečenicu Groot zna?', '„Ja sam Groot.“', '„Mi smo Groot.“', '„Ja sam drvo.“', '„Groot je ovde.“']
  ],
  'age-of-ultron': [
    ['Ko je napravio Ultrona?', 'Tony i Bruce', 'Hank Pym', 'Thanos', 'Hidra'],
    ['Koji kamen je u Visionovom čelu?', 'Kamen uma', 'Kamen moći', 'Kamen duše', 'Kamen vremena'],
    ['Koji grad Ultron podiže u vazduh?', 'Sokoviju', 'Wakandu', 'Latveriju', 'Madripur'],
    ['Ko od blizanaca Maximoff pogine?', 'Pietro', 'Wanda', 'Oboje', 'Niko'],
    ['Ko na kraju podigne Mjolnir pored Thora?', 'Vision', 'Steve', 'Tony', 'Hulk'],
    ['Gde se Osvetnici kriju posle Wandinih vizija?', 'Na Clintovoj farmi', 'U Starkovoj kuli', 'U Wakandi', 'Na Asgardu']
  ],
  'ant-man': [
    ['Ko je prvi Ant-Man?', 'Hank Pym', 'Scott Lang', 'Darren Cross', 'Bill Foster'],
    ['Ko je negativac?', 'Darren Cross (Yellowjacket)', 'Ghost', 'Kang', 'Sonny Burch'],
    ['Sa kojim Osvetnikom se Scott bori u bazi?', 'Falconom', 'Hawkeyem', 'Black Widow', 'Visionom'],
    ['Gde Scott upadne kad se previše smanji?', 'U kvantno carstvo', 'U Mračnu dimenziju', 'U Prazninu', 'U astralnu ravan'],
    ['Šta Scott radi pre nego što postane Ant-Man?', 'Izlazi iz zatvora (provalnik)', 'Radi kao naučnik', 'Vojnik je', 'Policajac je']
  ],
  'civil-war': [
    ['Kako se zove dokument koji stavlja Osvetnike pod kontrolu?', 'Sporazum iz Sokovije', 'Zakon o registraciji', 'Protokol S.H.I.E.L.D.', 'Wakandski pakt'],
    ['Ko je pravi negativac koji ih zavadi?', 'Helmut Zemo', 'Red Skull', 'Thaddeus Ross', 'Crossbones'],
    ['Ko pogine u eksploziji u Beču?', 'Kralj T\'Chaka', 'Peggy Carter', 'Rhodey', 'Sharon Carter'],
    ['Šta Tony vidi na snimku u Sibiru?', 'Da je Bucky ubio njegove roditelje', 'Da je Steve izdao S.H.I.E.L.D.', 'Da je Zemo Hidra', 'Da je Vision ranio Rhodeya'],
    ['Koga Tony vrbuje iz Kvinsa?', 'Spider-Mana', 'Ant-Mana', 'Black Panthera', 'Falcona'],
    ['Ko postane džin na aerodromu?', 'Ant-Man', 'Hulk', 'Vision', 'Black Panther']
  ],
  'doctor-strange': [
    ['Zašto Strange više ne može da operiše?', 'Saobraćajka mu je uništila ruke', 'Izgubio je vid', 'Izbačen je iz bolnice', 'Otrovan je'],
    ['Ko je njegova učiteljica?', 'Ancient One', 'Christine Palmer', 'Wong', 'Clea'],
    ['Koji kamen je u Agamottovom oku?', 'Kamen vremena', 'Kamen uma', 'Kamen prostora', 'Kamen duše'],
    ['Kako Strange pobeđuje Dormammua?', 'Zarobi ga u vremensku petlju', 'Kamenom moći', 'Plaštom levitacije', 'Darkholdom'],
    ['Ko je Kaecilius?', 'Bivši učenik koji služi Dormammuu', 'Strangeov kolega iz bolnice', 'Wongov brat', 'Agent S.H.I.E.L.D.-a']
  ],
  'guardians-2': [
    ['Ko je Quillov otac?', 'Ego', 'Yondu', 'Thanos', 'Ronan'],
    ['Šta je Ego zapravo?', 'Živa planeta', 'Kree general', 'Ravager', 'Robot'],
    ['Ko pogine spašavajući Quilla?', 'Yondu', 'Rocket', 'Drax', 'Kraglin'],
    ['Šta Rocket ukrade od zlatnog naroda Sovereign?', 'Baterije', 'Kuglu', 'Kasetu', 'Brod'],
    ['Šta Mantis ume?', 'Da oseti i menja tuđe emocije', 'Da leti', 'Da čita misli', 'Da se teleportuje']
  ],
  'spider-man-homecoming': [
    ['Ko je Vulture?', 'Adrian Toomes', 'Mac Gargan', 'Quentin Beck', 'Norman Osborn'],
    ['Ko je Vulture Peteru zapravo?', 'Otac devojke sa kojom ide na ples', 'Njegov profesor', 'Tonyjev partner', 'Njegov ujak'],
    ['Kako se zove Peterov najbolji drug?', 'Ned', 'Flash', 'Harry', 'Miles'],
    ['Ko Peteru oduzme odelo?', 'Tony Stark', 'Happy', 'May', 'Vulture'],
    ['Na kom spomeniku Peter spašava drugare iz lifta?', 'Vašingtonovom spomeniku', 'Kipu slobode', 'Empajer stejt bildingu', 'Bruklinskom mostu']
  ],
  'thor-ragnarok': [
    ['Ko je Hela?', 'Thorova starija sestra', 'Lokijeva ćerka', 'Odinova žena', 'Kraljica Ledenih divova'],
    ['Šta Hela uništi na početku?', 'Mjolnir', 'Bifrost', 'Thorovo oko', 'Odinov presto'],
    ['Na kojoj planeti Thor postane gladijator?', 'Sakaar', 'Xandar', 'Titan', 'Vormir'],
    ['Ko je šampion Grandmastera?', 'Hulk', 'Korg', 'Valkyrie', 'Loki'],
    ['Ko na kraju uništi Asgard?', 'Surtur', 'Hela', 'Fenris', 'Thanos']
  ],
  'black-panther': [
    ['Ko izaziva T\'Challu za presto?', 'Erik Killmonger', 'M\'Baku', 'Ulysses Klaue', 'W\'Kabi'],
    ['Šta Killmonger hoće?', 'Da da wakandsko oružje svima širom sveta', 'Da uništi Wakandu', 'Da pobegne u Ameriku', 'Da ukrade kamen'],
    ['Ko je Shuri?', 'T\'Challina sestra i genije', 'Generalka Dora Milaje', 'Njegova majka', 'Njegova devojka'],
    ['Šta daje moć Crnoj panteri?', 'Srcolika biljka', 'Vibranijumski serum', 'Kamen moći', 'Prsten predaka'],
    ['Kako se zove generalka Dora Milaje?', 'Okoye', 'Nakia', 'Ramonda', 'Ayo']
  ],
  'infinity-war': [
    ['Šta Thanos dobije na Vormiru?', 'Kamen duše', 'Kamen uma', 'Kamen moći', 'Kamen vremena'],
    ['Koga Thanos žrtvuje za taj kamen?', 'Gamoru', 'Nebulu', 'Lokija', 'Ebony Mawa'],
    ['Gde je velika bitka na Zemlji?', 'U Wakandi', 'U Njujorku', 'U Londonu', 'U Sokoviji'],
    ['Koje oružje Thor napravi u Nidavelliru?', 'Stormbreaker', 'Mjolnir', 'Gungnir', 'Jarnbjorn'],
    ['Šta se desi kad Thanos pucne prstima?', 'Nestane pola svih živih bića', 'Nestanu svi heroji', 'Zemlja se uništi', 'Vreme se vrati'],
    ['Koga Fury pozove pejdžerom na kraju?', 'Captain Marvel', 'Coulsona', 'Mariju Hill', 'Tonyja']
  ],
  'ant-man-wasp': [
    ['Koga Hank i Hope traže u kvantnom carstvu?', 'Janet van Dyne', 'Cassie', 'Billa Fostera', 'Kanga'],
    ['Ko je Ghost?', 'Ava Starr', 'Hope van Dyne', 'Sonny Burch', 'Darren Cross'],
    ['Zašto je Scott u kućnom pritvoru?', 'Zbog borbe u Civil War', 'Zbog krađe u Ant-Manu', 'Zbog Hidre', 'Zbog Thanosa'],
    ['Šta se desi u sceni posle špice?', 'Scott ostane zarobljen u kvantnom carstvu', 'Hank postane Yellowjacket', 'Ghost umre', 'Scott upozna Kanga']
  ],
  'captain-marvel': [
    ['Kako Carol zovu među Kreeima?', 'Vers', 'Mar-Vell', 'Binary', 'Starforce'],
    ['Kako se zove mačka (Flerken)?', 'Goose', 'Maverick', 'Chewie', 'Lucky'],
    ['Kako Fury izgubi oko u ovom filmu?', 'Izgrebe ga Goose', 'U eksploziji', 'U borbi sa Skrullom', 'U Hidrinom napadu'],
    ['Koja rasa menja oblik?', 'Skrulli', 'Kree', 'Chitauri', 'Sovereign'],
    ['U kojoj deceniji se film dešava?', 'Devedesetim', 'Osamdesetim', 'Sedamdesetim', 'Dvehiljaditim']
  ],
  'endgame': [
    ['Koliko godina prođe posle Thanosovog pucnja?', '5', '1', '3', '10'],
    ['Kako se vraćaju u prošlost?', 'Kroz kvantno carstvo', 'Kamenom vremena', 'Kroz TVA', 'Bifrostom'],
    ['Ko se žrtvuje na Vormiru?', 'Natasha', 'Clint', 'Gamora', 'Nebula'],
    ['Ko podigne Mjolnir u bici sa Thanosom?', 'Captain America', 'Captain Marvel', 'Hulk', 'Tony'],
    ['Šta Tony kaže pre svog pucnja?', '„Ja sam Iron Man.“', '„Osvetnici, okupite se.“', '„Volim te 3000.“', '„Imamo Hulka.“'],
    ['Šta Steve uradi na kraju?', 'Ostane u prošlosti sa Peggy', 'Ode u svemir', 'Postane kralj Wakande', 'Uništi štit']
  ],
  'far-from-home': [
    ['Ko je Mysterio zapravo?', 'Bivši Starkov radnik koji pravi iluzije', 'Čarobnjak iz druge Zemlje', 'Skrull', 'Agent S.H.I.E.L.D.-a'],
    ['Šta Tony ostavi Peteru?', 'Naočare E.D.I.T.H.', 'Novo odelo', 'Reaktor', 'Svoju kompaniju'],
    ['U kom gradu je prvi napad „Elementala“ na izletu?', 'U Veneciji', 'U Pragu', 'U Londonu', 'U Berlinu'],
    ['Šta Mysterio otkrije u sceni posle špice?', 'Da je Peter Spider-Man', 'Da je živ', 'Da je Fury Skrull', 'Da je Tony živ'],
    ['Ko je sve vreme glumio Nicka Furyja?', 'Talos (Skrull)', 'Maria Hill', 'Mysterio', 'Happy']
  ],
  'black-widow': [
    ['Ko je Yelena Belova?', 'Natašina „sestra“', 'Njena majka', 'Taskmaster', 'Agentkinja S.H.I.E.L.D.-a'],
    ['Ko je Red Guardian?', 'Alexei, njihov „otac“', 'Dreykov', 'Bucky', 'Mason'],
    ['Ko je Taskmaster?', 'Dreykovljeva ćerka Antonia', 'Yelena', 'Melina', 'Ava Starr'],
    ['Šta je Crvena soba?', 'Program koji pravi Udovice', 'Zatvor u Sibiru', 'Hidrina baza', 'Sovjetska vojska'],
    ['Kada se film dešava?', 'Posle Civil Wara', 'Posle Endgamea', 'Pre Iron Mana', 'Posle Infinity Wara']
  ],
  'shang-chi': [
    ['Ko je Shang-Chijev otac?', 'Wenwu, vođa Deset prstenova', 'Trevor Slattery', 'Razor Fist', 'Ancient One'],
    ['Kako se zove skriveno selo?', 'Ta Lo', 'K\'un-Lun', 'Kamar-Taj', 'Talokan'],
    ['Kako se zove Shang-Chijeva najbolja drugarica?', 'Katy', 'Xialing', 'Jiang Nan', 'Wong'],
    ['Čiji glas Wenwu misli da čuje iza kapije?', 'Svoje pokojne žene', 'Svog sina', 'Svoje ćerke', 'Svog oca'],
    ['Ko je Morris?', 'Krilato stvorenje bez lica', 'Zmaj', 'Pas', 'Robot']
  ],
  'eternals': [
    ['Ko je poslao Eternalse na Zemlju?', 'Celestijal Arishem', 'Thanos', 'Odin', 'Ego'],
    ['Šta je Tiamut?', 'Celestijal koji se rađa u Zemlji', 'Grad Eternalsa', 'Njihov brod', 'Devijant'],
    ['Ko je izdajnik u timu?', 'Ikaris', 'Sersi', 'Kingo', 'Druig'],
    ['Protiv koga se Eternals bore hiljadama godina?', 'Devijanata', 'Skrulla', 'Kreeja', 'Chitaurija'],
    ['Ko se pojavi u sceni posle špice?', 'Thanosov brat Eros', 'Thanos', 'Kang', 'Galactus']
  ],
  'multiverse-of-madness': [
    ['Ko je America Chavez?', 'Devojka koja putuje kroz multiverzum', 'Strangeova učenica', 'Wandina ćerka', 'Agentkinja TVA'],
    ['Ko je negativac?', 'Wanda', 'Mordo', 'Kang', 'Dormammu'],
    ['Koja knjiga kvari Wandu?', 'Darkhold', 'Knjiga Vishanti', 'Knjiga Cagliostra', 'Necronomicon'],
    ['Ko su Iluminati?', 'Tajna grupa heroja sa druge Zemlje', 'Čarobnjaci iz Kamar-Taja', 'Agenti TVA', 'Thanosova vojska'],
    ['Ko se pojavi u sceni posle špice?', 'Clea', 'Wong', 'Mordo', 'Agatha']
  ],
  'love-and-thunder': [
    ['Kako zovu Gorra?', 'Bogoubica', 'Razarač svetova', 'Mračni vilenjak', 'Ledeni kralj'],
    ['Ko postaje Mighty Thor?', 'Jane Foster', 'Valkyrie', 'Sif', 'Darcy'],
    ['Šta vuče Thorov brod?', 'Dve džinovske koze', 'Zmaj', 'Bifrost', 'Konji'],
    ['Šta Gorr na kraju poželi?', 'Da mu se vrati ćerka', 'Da ubije sve bogove', 'Da postane bog', 'Da uništi Asgard'],
    ['Koga Thor usvoji na kraju?', 'Gorrovu ćerku Love', 'Groota', 'Korga', 'Miek']
  ],
  'wakanda-forever': [
    ['Ko je Namor?', 'Kralj podvodnog Talokana', 'Atlantski princ', 'Kree general', 'Mutant iz X-Mena'],
    ['Ko postaje nova Crna pantera?', 'Shuri', 'Okoye', 'Nakia', 'M\'Baku'],
    ['Ko pogine od Namora?', 'Kraljica Ramonda', 'Okoye', 'Riri', 'Everett Ross'],
    ['Ko je Riri Williams?', 'Studentkinja koja je napravila detektor vibranijuma', 'Wakandska špijunka', 'Namorova sestra', 'CIA agentkinja'],
    ['Koga Shuri upozna u sceni posle špice?', 'T\'Challinog sina', 'Namora', 'Killmongera', 'Tonyja']
  ],
  'quantumania': [
    ['Ko je glavni negativac?', 'Kang Osvajač', 'Yellowjacket', 'Ghost', 'Ultron'],
    ['Ko je M.O.D.O.K. u ovom filmu?', 'Darren Cross', 'Bill Foster', 'Sonny Burch', 'Hank Pym'],
    ['Ko je Cassie?', 'Scottova ćerka', 'Hopeova sestra', 'Kangova saveznica', 'Janetina prijateljica'],
    ['Ko ih na kraju spase?', 'Hankovi pametni mravi', 'Osvetnici', 'Wasp iz budućnosti', 'Kang'],
    ['Gde se dešava skoro ceo film?', 'U kvantnom carstvu', 'Na Asgardu', 'U TVA', 'U San Francisku']
  ],
  'guardians-3': [
    ['Ko je napravio Rocketa?', 'High Evolutionary', 'Thanos', 'Ego', 'Collector'],
    ['Čija prošlost je u centru filma?', 'Rocketova', 'Quillova', 'Nebulina', 'Draxova'],
    ['Ko je Adam Warlock?', 'Zlatni čovek koga je napravio Sovereign', 'Quillov brat', 'Kree vojnik', 'Robot'],
    ['Kako se zove Rocketova drugarica vidrica?', 'Lylla', 'Teefs', 'Floor', 'Cosmo'],
    ['Ko je na kraju novi kapiten Guardiansa?', 'Rocket', 'Groot', 'Nebula', 'Mantis']
  ],
  'the-marvels': [
    ['Koje tri heroine menjaju mesta kad koriste moći?', 'Carol, Monica i Kamala', 'Carol, Wanda i Kamala', 'Monica, Kate i Yelena', 'Carol, Jen i Monica'],
    ['Ko je negativka?', 'Dar-Benn', 'Ronan', 'Gravik', 'Nebula'],
    ['Šta Dar-Benn koristi?', 'Narukvicu (par Kamaline)', 'Kamen moći', 'Kosmičku kocku', 'Mjolnir'],
    ['Na kojoj planeti se sve priča pevanjem?', 'Aladna', 'Hala', 'Xandar', 'Sakaar'],
    ['Koga Monica sretne u sceni posle špice?', 'Beasta (Hank McCoy)', 'Wolverinea', 'Kanga', 'Reeda Richardsa']
  ],
  'deadpool-wolverine': [
    ['Ko je Cassandra Nova?', 'Charlesova bliznakinja', 'Agentkinja TVA', 'Jean Grey', 'Mystiquina ćerka'],
    ['Gde TVA baca otpad iz vremenskih linija?', 'U Prazninu', 'U kvantno carstvo', 'U Mračnu dimenziju', 'U Valhalu'],
    ['Zašto Deadpool traži drugog Wolverinea?', 'Njegov svet umire bez Logana', 'Da ga pobedi', 'Da mu vrati dug', 'Da ga dovede u Osvetnike'],
    ['Kako se zove pas iz Praznine?', 'Dogpool', 'Lucky', 'Goose', 'Cosmo'],
    ['Koga glumi Chris Evans u Praznini?', 'Johnnyja Storma', 'Captain Americu', 'Cyclopsa', 'Ghost Ridera']
  ],
  'brave-new-world': [
    ['Ko je novi Captain America?', 'Sam Wilson', 'Bucky', 'John Walker', 'Joaquin Torres'],
    ['U šta se pretvori predsednik Ross?', 'U Crvenog Hulka', 'U Abominationa', 'U Leadera', 'U Sentry'],
    ['Ko manipuliše Rossom iz senke?', 'Samuel Sterns', 'Valentina', 'Zemo', 'Sidewinder'],
    ['Koji metal je pronađen na Celestijalskom ostrvu?', 'Adamantijum', 'Vibranijum', 'Uru', 'Karbonadijum'],
    ['Ko je novi Falcon?', 'Joaquin Torres', 'Isaiah Bradley', 'Rhodey', 'Eli Bradley']
  ],
  'thunderbolts': [
    ['Šta znači zvezdica (*) u imenu?', 'Na kraju postanu „Novi Osvetnici“', 'Da je film peti u nizu', 'Da je Bob tajni član', 'Ništa'],
    ['Ko je Bob?', 'Sentry (i Void)', 'Ghost', 'U.S. Agent', 'Taskmaster'],
    ['Ko ih je sve poslala u isti trezor da se pobiju?', 'Valentina', 'Mel', 'Yelena', 'Melina'],
    ['Šta Void radi ljudima u Njujorku?', 'Pretvara ih u senke', 'Leti sa njima', 'Kontroliše im um', 'Briše im sećanje'],
    ['Ko vodi tim?', 'Yelena', 'Bucky', 'Red Guardian', 'John Walker']
  ],
  'fantastic-four-first-steps': [
    ['Ko je Galactus?', 'Biće koje jede planete', 'Kree car', 'Dr Doom', 'Celestijal Arishem'],
    ['Šta Galactus traži od Reeda i Sue?', 'Njihovog sina Franklina', 'Reedov mozak', 'Kosmičku moć', 'Zemlju kao dom'],
    ['Ko je Silver Surfer u ovom filmu?', 'Shalla-Bal', 'Norrin Radd', 'Sue Storm', 'Frankie Raye'],
    ['Kako se zove njihov robot?', 'H.E.R.B.I.E.', 'J.A.R.V.I.S.', 'F.R.I.D.A.Y.', 'E.D.I.T.H.'],
    ['Na kojoj Zemlji žive Fantastična četvorka?', 'Zemlja-828', 'Zemlja-616', 'Zemlja-199999', 'Zemlja-838']
  ],

  /* ---------------- MCU serije ---------------- */

  'wandavision': [
    ['U kom gradiću Wanda pravi svoj sitcom?', 'Westview', 'Riverdale', 'Hawkins', 'Smallville'],
    ['Ko je zapravo komšinica Agnes?', 'Agatha Harkness', 'Monica Rambeau', 'Darcy', 'Hela'],
    ['Kako se zovu Wandini blizanci?', 'Billy i Tommy', 'Pietro i Erik', 'Peter i Ned', 'Teddy i Billy'],
    ['Ko je „lažni Pietro“?', 'Ralph Bohner', 'Vision', 'Agatha', 'Hayward'],
    ['Koja agencija opkoljava Westview?', 'S.W.O.R.D.', 'S.H.I.E.L.D.', 'TVA', 'Hidra']
  ],
  'falcon-winter-soldier': [
    ['Koga vlada proglasi novim Captain Americom?', 'Johna Walkera', 'Sama Wilsona', 'Buckyja', 'Isaiaha Bradleya'],
    ['Ko vodi Flag Smashere?', 'Karli Morgenthau', 'Sharon Carter', 'Valentina', 'Zemo'],
    ['Koga Bucky izvuče iz zatvora za pomoć?', 'Zemoa', 'Crossbonesa', 'Batroca', 'Rumlowa'],
    ['Ko je zapravo Power Broker?', 'Sharon Carter', 'Zemo', 'Valentina', 'Karli'],
    ['Šta Sam postane na kraju?', 'Captain America', 'Novi Falcon', 'Agent S.H.I.E.L.D.-a', 'Senator']
  ],
  'loki-s1': [
    ['Šta znači TVA?', 'Time Variance Authority', 'Time Vault Agency', 'Total Void Army', 'The Variant Alliance'],
    ['Ko je Mobius?', 'Agent TVA koji radi sa Lokijem', 'Kang', 'Lokijev brat', 'Čuvar Praznine'],
    ['Ko je Sylvie?', 'Lokijeva varijanta', 'Lokijeva ćerka', 'Agentkinja TVA', 'Enchantress'],
    ['Šta je Miss Minutes?', 'Animirani sat, maskota TVA', 'Sudija TVA', 'Robot', 'Lokijeva veverica'],
    ['Ko je na kraju vremena?', 'He Who Remains', 'Thanos', 'Odin', 'Alioth']
  ],
  'loki-s2': [
    ['Ko je Ouroboros (O.B.)?', 'Tehničar TVA', 'Kangova varijanta', 'Sudija', 'Minuteman'],
    ['Šta je Temporalni razboj?', 'Mašina koja tka vremenske linije', 'Zatvor TVA', 'Lokijev brod', 'Kamen vremena'],
    ['Ko je Victor Timely?', 'Kangova varijanta iz 19. veka', 'Mobiusov otac', 'Agent TVA', 'Sylvijin saveznik'],
    ['Kakvu moć Loki uči?', 'Da klizi kroz vreme', 'Da leti', 'Da čita misli', 'Da se smanjuje'],
    ['Gde Loki završi na kraju?', 'Na prestolu, drži grane vremena', 'U Asgardu', 'Na Zemlji', 'U Praznini']
  ],
  'hawkeye': [
    ['Ko je Kate Bishop?', 'Mlada streličarka, Clintova fanica', 'Clintova ćerka', 'Agentkinja S.H.I.E.L.D.-a', 'Yelenina sestra'],
    ['Ko je bio Ronin?', 'Clint posle Thanosovog pucnja', 'Kateina mama', 'Kingpin', 'Jack Duquesne'],
    ['Ko je glavni šef iz senke?', 'Kingpin', 'Zemo', 'Red Skull', 'Valentina'],
    ['Ko dolazi da osveti Natašu?', 'Yelena', 'Melina', 'Maya', 'Bucky'],
    ['Kako se zove pas?', 'Lucky (Pizza Dog)', 'Goose', 'Cosmo', 'Dogpool']
  ],
  'moon-knight': [
    ['Ko je Steven Grant?', 'Prodavac u muzejskoj suvenirnici', 'Plaćenik', 'Arheolog', 'Policajac'],
    ['Kom bogu služi Moon Knight?', 'Khonshuu', 'Anubisu', 'Ra', 'Ammit'],
    ['Ko je Arthur Harrow?', 'Avatar boginje Ammit', 'Stevenov brat', 'Agent S.H.I.E.L.D.-a', 'Vlasnik muzeja'],
    ['Ko je Layla?', 'Marcova žena', 'Stevenova sestra', 'Harrowova sledbenica', 'Doktorka'],
    ['Kako se zove treća ličnost?', 'Jake Lockley', 'Marc Spector', 'Steven Grant', 'Arthur Harrow']
  ],
  'ms-marvel': [
    ['Iz kog grada je Kamala Khan?', 'Džersi Siti', 'Njujork', 'Čikago', 'Los Anđeles'],
    ['Šta joj budi moći?', 'Narukvica njene prabake', 'Kamen beskonačnosti', 'Terrigen magla', 'Kosmička oluja'],
    ['Ko je Kamalin idol?', 'Captain Marvel', 'Iron Man', 'Thor', 'Spider-Man'],
    ['Šta se otkrije o Kamali na kraju?', 'Da je mutant', 'Da je Kree', 'Da je Inhuman', 'Da je Skrull']
  ],
  'she-hulk': [
    ['Kako Jennifer dobije moći?', 'Bruceova krv uđe u njenu posle nesreće', 'Gama bombom', 'Serumom', 'Od Thanosa'],
    ['Šta je Jennifer po zanimanju?', 'Advokatica', 'Novinarka', 'Lekarka', 'Policajka'],
    ['Kojeg starog negativca Jen brani na sudu?', 'Abominationa (Blonsky)', 'Lokija', 'Zemoa', 'Vulturea'],
    ['Koji heroj se pojavi i postane Jennin dečko?', 'Daredevil', 'Wong', 'Hulk', 'Hawkeye'],
    ['Šta Jen uradi u finalu?', 'Izađe iz serije i ode kod K.E.V.I.N.-a', 'Pobedi Hulka', 'Postane Osvetnik', 'Izgubi moći']
  ],
  'secret-invasion': [
    ['Ko vodi pobunjene Skrulle?', 'Gravik', 'Talos', 'G\'iah', 'Varra'],
    ['Ko od starih saveznika pogine u prvoj epizodi?', 'Maria Hill', 'Rhodey', 'Talos', 'Everett Ross'],
    ['Ko je G\'iah?', 'Talosova ćerka', 'Furyjeva žena', 'Gravikova sestra', 'Agentkinja MI6'],
    ['Šta je „Žetva“ (Harvest)?', 'DNK heroja iz bitke sa Thanosom', 'Skrull brod', 'Furyjev plan', 'Kree oružje'],
    ['Ko je zapravo Furyjeva žena Priscilla?', 'Skrull', 'Kree', 'Agentkinja Hidre', 'Sonya Falsworth']
  ],
  'echo': [
    ['Ko je Maya Lopez?', 'Gluva borkinja iz naroda Choctaw', 'Kingpinova ćerka', 'Agentkinja S.H.I.E.L.D.-a', 'Kate Bishop'],
    ['Koga Maya zove „ujka“?', 'Kingpina', 'Clinta', 'Daredevila', 'Furyja'],
    ['Koji heroj se pojavi na početku serije?', 'Daredevil', 'Hawkeye', 'Moon Knight', 'Spider-Man']
  ],
  'agatha-all-along': [
    ['Šta je Put veštica?', 'Put sa izazovima koji daje šta želiš', 'Zatvor za veštice', 'Selo u Westviewu', 'Knjiga čini'],
    ['Ko je zapravo „Tinejdžer“ (Teen)?', 'Billy Maximoff', 'Tommy Maximoff', 'Pietro', 'Mephisto'],
    ['Ko je Rio Vidal?', 'Smrt', 'Agatina sestra', 'Wanda', 'Veštica proricanja'],
    ['Šta Agatha postane na kraju?', 'Duh', 'Scarlet Witch', 'Kraljica veštica', 'Obična žena']
  ],
  'what-if-s1': [
    ['Ko je Posmatrač (Watcher)?', 'Uatu, koji gleda multiverzum', 'Kang', 'He Who Remains', 'Odin'],
    ['Ko dobije serum umesto Stevea?', 'Peggy (Captain Carter)', 'Bucky', 'Howard Stark', 'Sharon'],
    ['Ko postane Star-Lord umesto Quilla?', 'T\'Challa', 'Thor', 'Killmonger', 'Yondu'],
    ['Šta Strange Supreme pokušava da vrati?', 'Christine', 'Svoje ruke', 'Wonga', 'Ancient One'],
    ['Ko je glavni negativac na kraju sezone?', 'Ultron sa svim kamenjem', 'Thanos', 'Kang', 'Dormammu']
  ],
  'werewolf-by-night': [
    ['Šta svi lovci jure?', 'Krvavi kamen', 'Kamen duše', 'Darkhold', 'Prsten'],
    ['Ko je Jack Russell?', 'Vukodlak', 'Lovac', 'Man-Thing', 'Vampir'],
    ['Ko je Elsa?', 'Ćerka Ulyssesa Bloodstonea', 'Jackova sestra', 'Veštica', 'Agentkinja'],
    ['Kako izgleda skoro ceo specijal?', 'Crno-beli, kao stari horor', 'Animiran', 'Kao sitcom', 'U 3D']
  ],
  'gotg-holiday-special': [
    ['Šta Guardians „poklone“ Quillu?', 'Kevina Bacona', 'Kasetu', 'Novi brod', 'Psa'],
    ['Šta Mantis otkrije Quillu?', 'Da su brat i sestra', 'Da je Ego živ', 'Da ga voli', 'Da je Gamora živa'],
    ['Koji praznik slave?', 'Božić', 'Noć veštica', 'Dan zahvalnosti', 'Novu godinu']
  ],
  'daredevil-born-again-s1': [
    ['Ko postane gradonačelnik Njujorka?', 'Wilson Fisk', 'Matt Murdock', 'Foggy', 'Karen Page'],
    ['Ko pogine u prvoj epizodi?', 'Foggy Nelson', 'Karen Page', 'Bullseye', 'Vanessa'],
    ['Ko je Muse?', 'Serijski ubica-umetnik', 'Fiskova žena', 'Policajac', 'Novinar'],
    ['Koji heroj se vrati sa lobanjom na grudima?', 'Punisher', 'Moon Knight', 'Ghost Rider', 'Blade']
  ],
  'ironheart': [
    ['Iz kog grada je Riri Williams?', 'Čikago', 'Džersi Siti', 'Njujork', 'Oakland'],
    ['Ko je Hood?', 'Parker Robbins', 'Mephisto', 'Zeke Stane', 'Joe McGillicuddy'],
    ['Ko se otkrije kao demon na kraju?', 'Mephisto', 'Dormammu', 'Knull', 'Blackheart'],
    ['Na kome je zasnovan Ririn AI N.A.T.A.L.I.E.?', 'Na njenoj pokojnoj drugarici', 'Na Tonyju', 'Na njenoj mami', 'Na Shuri']
  ],

  /* ---------------- Spider-Man i Sony ---------------- */

  'spider-man-2002': [
    ['Ko je Green Goblin?', 'Norman Osborn', 'Harry Osborn', 'Otto Octavius', 'Eddie Brock'],
    ['Šta ujka Ben kaže Peteru?', '„Sa velikom moći dolazi velika odgovornost.“', '„Nikad ne odustaj.“', '„Ti si heroj.“', '„Čuvaj May.“'],
    ['Kako se zove Peterova simpatija?', 'Mary Jane', 'Gwen Stacy', 'Liz Allan', 'Betty Brant'],
    ['Ko je Peterov najbolji drug?', 'Harry Osborn', 'Ned', 'Flash', 'Eddie'],
    ['Ko glumi Petera?', 'Tobey Maguire', 'Andrew Garfield', 'Tom Holland', 'James Franco']
  ],
  'spider-man-2': [
    ['Ko je Doc Ock?', 'Otto Octavius', 'Curt Connors', 'Norman Osborn', 'Max Dillon'],
    ['Šta Otto pokušava da napravi?', 'Fuzionu reakciju', 'Vremensku mašinu', 'Lek za rak', 'Robota'],
    ['Šta Peter zaustavi rukama i mrežom?', 'Voz', 'Avion', 'Most', 'Lift'],
    ['Zašto Peter privremeno izgubi moći?', 'Zbog sumnje u sebe', 'Zbog simbiota', 'Zbog Goblina', 'Zbog bolesti']
  ],
  'spider-man-3': [
    ['Šta dolazi iz svemira?', 'Crni simbiot', 'Kamen', 'Meteor sa paukom', 'Kree brod'],
    ['Ko postaje Venom?', 'Eddie Brock', 'Harry Osborn', 'Flint Marko', 'Peter'],
    ['Ko je Sandman?', 'Flint Marko', 'Max Dillon', 'Adrian Toomes', 'Curt Connors'],
    ['Ko pogine na kraju?', 'Harry Osborn', 'Mary Jane', 'Ujna May', 'Eddie Brock']
  ],
  'amazing-spider-man': [
    ['Ko glumi Petera?', 'Andrew Garfield', 'Tobey Maguire', 'Tom Holland', 'Jake Gyllenhaal'],
    ['Ko je Lizard?', 'Curt Connors', 'Norman Osborn', 'Max Dillon', 'Aleksei Sytsevich'],
    ['Kako se zove Peterova devojka?', 'Gwen Stacy', 'Mary Jane', 'Liz', 'Felicia'],
    ['Ko je Gwenin otac?', 'Kapetan policije George Stacy', 'Norman Osborn', 'Curt Connors', 'J. Jonah Jameson']
  ],
  'amazing-spider-man-2': [
    ['Ko je Electro?', 'Max Dillon', 'Harry Osborn', 'Aleksei Sytsevich', 'Curt Connors'],
    ['Ko pogine na kraju?', 'Gwen Stacy', 'Ujna May', 'Harry', 'Mary Jane'],
    ['Ko postane Green Goblin?', 'Harry Osborn', 'Norman Osborn', 'Max Dillon', 'Peter'],
    ['Koji negativac se pojavi na samom kraju u oklopu nosoroga?', 'Rhino', 'Vulture', 'Scorpion', 'Shocker']
  ],
  'venom': [
    ['Šta je Eddie Brock po zanimanju?', 'Novinar', 'Policajac', 'Naučnik', 'Advokat'],
    ['Ko vodi Life Foundation?', 'Carlton Drake', 'Cletus Kasady', 'Norman Osborn', 'Eddie'],
    ['Kako se zove drugi, zli simbiot?', 'Riot', 'Carnage', 'Toxin', 'Knull'],
    ['Ko se pojavi u sceni posle špice?', 'Cletus Kasady', 'Spider-Man', 'Morbius', 'Kraven']
  ],
  'venom-carnage': [
    ['Ko postane Carnage?', 'Cletus Kasady', 'Eddie Brock', 'Carlton Drake', 'Patrick Mulligan'],
    ['Ko je Shriek?', 'Kasadyjeva devojka sa moćnim vriskom', 'Anne Weying', 'Agentkinja', 'Simbiot'],
    ['Šta se desi u sceni posle špice?', 'Eddie i Venom vide Petera na TV-u', 'Venom umre', 'Pojavi se Knull', 'Eddie postane Carnage']
  ],
  'into-the-spider-verse': [
    ['Ko je Miles Morales?', 'Tinejdžer iz Bruklina, novi Spider-Man', 'Peterov sin', 'Agent S.H.I.E.L.D.-a', 'Gwenin brat'],
    ['Ko je Prowler?', 'Milesov ujak Aaron', 'Kingpin', 'Milesov otac', 'Doc Ock'],
    ['Zašto Kingpin otvara portal?', 'Da vrati ženu i sina', 'Da osvoji multiverzum', 'Da ubije Spider-Mana', 'Da obogati'],
    ['Ko uči Milesa da bude Spider-Man?', 'Peter B. Parker', 'Gwen', 'Spider-Noir', 'Peni Parker'],
    ['Koji Spider je crno-beli?', 'Spider-Man Noir', 'Spider-Ham', 'Spider-Gwen', 'Spider-Punk']
  ],
  'across-the-spider-verse': [
    ['Ko je Spot?', 'Naučnik prekriven portalima', 'Kingpin', 'Prowler', 'Vulture'],
    ['Ko vodi Spider-Društvo?', 'Miguel O\'Hara', 'Peter B. Parker', 'Gwen', 'Jessica Drew'],
    ['Šta su „kanonski događaji“?', 'Događaji koji moraju da se dese svakom Spideru', 'Filmovi o Spideru', 'Pravila škole', 'Portali'],
    ['Gde Miles završi na kraju?', 'U svetu u kom je on Prowler', 'U Bruklinu', 'Kod Gwen', 'U zatvoru'],
    ['Ko je Hobie?', 'Spider-Punk', 'Spider-Ham', 'Spider-Man 2099', 'Scarlet Spider']
  ],
  'morbius': [
    ['Iz čije DNK Morbius dobije moći?', 'Slepih miševa', 'Pauka', 'Vukova', 'Zmija'],
    ['Šta je Morbius po zanimanju?', 'Lekar i naučnik', 'Policajac', 'Novinar', 'Lovac'],
    ['Ko je Milo?', 'Morbiusov prijatelj koji postane negativac', 'Njegov brat', 'Agent', 'Vulture']
  ],
  'madame-web': [
    ['Šta Cassie Webb ume?', 'Da vidi budućnost', 'Da leti', 'Da pravi mrežu', 'Da čita misli'],
    ['Šta je Cassie po zanimanju?', 'Bolničarka hitne pomoći', 'Policajka', 'Naučnica', 'Učiteljica'],
    ['Koliko devojaka Cassie štiti?', 'Tri', 'Dve', 'Četiri', 'Pet']
  ],
  'venom-last-dance': [
    ['Ko je Knull?', 'Stvoritelj simbiota', 'Carnage', 'Riot', 'Vanzemaljski car'],
    ['Šta Knull traži?', 'Kodeks koji ga oslobađa', 'Eddiejevu glavu', 'Kamen', 'Zemlju'],
    ['Šta Venom uradi na kraju?', 'Žrtvuje se', 'Ode na Mesec', 'Postane Spider-Man', 'Pobegne']
  ],
  'kraven': [
    ['Kako se Kraven zove?', 'Sergei Kravinoff', 'Dmitri Smerdyakov', 'Aleksei Sytsevich', 'Nikolai Kravinoff'],
    ['Ko je Chameleon?', 'Kravenov brat', 'Kravenov otac', 'Rhino', 'Lovac'],
    ['Šta Kraven najviše radi?', 'Lovi lovokradice i kriminalce', 'Pravi mreže', 'Krade kamenje', 'Spašava pse']
  ],
  'no-way-home': [
    ['Šta Strange pokušava da uradi za Petera?', 'Čini da svet zaboravi da je Peter Spider-Man', 'Da vrati Tonyja', 'Da otvori multiverzum', 'Da ga nauči magiji'],
    ['Ko pogine i kaže čuvene reči o odgovornosti?', 'Ujna May', 'Happy', 'Ned', 'MJ'],
    ['Koji Spider-Mani dolaze iz drugih svetova?', 'Tobey i Andrew', 'Miles i Gwen', 'Spider-Noir i Spider-Ham', 'Miguel i Hobie'],
    ['Ko glumi Green Goblina?', 'Willem Dafoe', 'James Franco', 'Dane DeHaan', 'Alfred Molina'],
    ['Kako se završava film?', 'Niko se ne seća Petera', 'Peter postane Osvetnik', 'Peter ode u multiverzum', 'Peter otkrije identitet svetu']
  ],

  /* ---------------- X-Men (Fox) ---------------- */

  'x-men-2000': [
    ['Šta Magneto želi da uradi na Kipu slobode?', 'Da mašinom ljude pretvori u mutante', 'Da uništi Njujork', 'Da ubije Xaviera', 'Da ukrade Cerebro'],
    ['Šta se desi kad Rogue nekog dodirne?', 'Upija njegovu moć i život', 'Zaledi ga', 'Leti', 'Postane nevidljiva'],
    ['Kako se zove Xavierova mašina za traženje mutanata?', 'Cerebro', 'Sentinel', 'Danger Room', 'Blackbird'],
    ['Ko menja oblik?', 'Mystique', 'Storm', 'Toad', 'Sabretooth'],
    ['Ko glumi Wolverinea?', 'Hugh Jackman', 'James Marsden', 'Ian McKellen', 'Patrick Stewart']
  ],
  'x2': [
    ['Ko je William Stryker?', 'Pukovnik koji mrzi mutante', 'Magnetov učenik', 'Predsednik', 'Mutant'],
    ['Ko napada Belu kuću na početku?', 'Nightcrawler', 'Mystique', 'Pyro', 'Lady Deathstrike'],
    ['Šta Stryker pravi?', 'Lažni Cerebro da ubije sve mutante', 'Sentinela', 'Lek', 'Adamantijum'],
    ['Ko pogine na kraju zadržavajući vodu?', 'Jean Grey', 'Storm', 'Cyclops', 'Rogue'],
    ['Ko od učenika pređe Magnetu?', 'Pyro', 'Iceman', 'Colossus', 'Kitty']
  ],
  'x-men-last-stand': [
    ['Šta je „lek“?', 'Lek koji briše mutantske moći', 'Lek za Wolverinea', 'Lek za Phoenix', 'Serum'],
    ['U koga se Jean pretvori?', 'Phoenix', 'Storm', 'Mystique', 'Rogue'],
    ['Gde je finalna bitka?', 'Na Alkatrazu', 'U Beloj kući', 'U Xavierovoj školi', 'Na Kipu slobode'],
    ['Ko na kraju zaustavi Jean?', 'Wolverine', 'Xavier', 'Magneto', 'Storm']
  ],
  'x-men-origins-wolverine': [
    ['Ko je Loganov brat?', 'Victor Creed (Sabretooth)', 'Scott Summers', 'Wade Wilson', 'Remy LeBeau'],
    ['Ko postane „Weapon XI“?', 'Wade Wilson', 'Victor', 'Gambit', 'Stryker'],
    ['Zašto Logan zaboravi sve na kraju?', 'Pogodi ga metak od adamantijuma', 'Xavier mu obriše um', 'Pao je sa litice', 'Udarac Sabretootha'],
    ['Ko je Gambit?', 'Remy LeBeau', 'Wade Wilson', 'John Wraith', 'Fred Dukes']
  ],
  'x-men-first-class': [
    ['U kojoj deceniji se film dešava?', 'Šezdesetim', 'Osamdesetim', 'Devedesetim', 'Četrdesetim'],
    ['Ko je Sebastian Shaw?', 'Negativac koji upija energiju', 'Xavierov otac', 'Agent CIA', 'Magnetov brat'],
    ['Kako Charles ostane paralizovan?', 'Odbijen metak ga pogodi u kičmu', 'Pao je', 'Shaw ga napadne', 'Mystique ga udari'],
    ['Ko je Beast?', 'Hank McCoy', 'Alex Summers', 'Sean Cassidy', 'Darwin']
  ],
  'the-wolverine': [
    ['U kojoj zemlji se dešava film?', 'U Japanu', 'U Kanadi', 'U Kini', 'U Americi'],
    ['Šta Yashida želi od Logana?', 'Njegovu moć izlečenja', 'Njegove kandže', 'Da ga čuva', 'Adamantijum'],
    ['Ko je Yukio?', 'Mutantkinja koja vidi smrt', 'Yashidina unuka', 'Viper', 'Ninja Hand'],
    ['Ko je Mariko?', 'Yashidina unuka', 'Yukiova sestra', 'Viper', 'Jean']
  ],
  'days-of-future-past': [
    ['Ko se šalje u prošlost?', 'Wolverine', 'Xavier', 'Kitty', 'Magneto'],
    ['Ko je Bolivar Trask?', 'Tvorac Sentinela', 'Mutant', 'Predsednik', 'Strykerov šef'],
    ['U koju godinu Logan putuje?', '1973.', '1962.', '1983.', '1945.'],
    ['Ko izvlači Magneta iz Pentagona?', 'Quicksilver', 'Beast', 'Mystique', 'Havok'],
    ['Koga Mystique hoće da ubije?', 'Traska', 'Xaviera', 'Logana', 'Predsednika Niksona']
  ],
  'deadpool': [
    ['Zašto Wade pristane na eksperiment?', 'Ima rak', 'Za novac', 'Zbog Vanesse', 'Da postane Osvetnik'],
    ['Ko je Ajax?', 'Francis, čovek koji ga je mučio', 'Colossus', 'Weasel', 'Cable'],
    ['Kako se zove Wadeova devojka?', 'Vanessa', 'Domino', 'Blind Al', 'Negasonic'],
    ['Koja dva X-Mena mu „pomažu“?', 'Colossus i Negasonic Teenage Warhead', 'Wolverine i Storm', 'Cyclops i Jean', 'Beast i Mystique'],
    ['Kako se zove taksista?', 'Dopinder', 'Weasel', 'Bob', 'Peter']
  ],
  'x-men-apocalypse': [
    ['Ko je Apocalypse?', 'Prvi mutant iz drevnog Egipta', 'Xavierov brat', 'Sentinel', 'Shawov učenik'],
    ['U kojoj deceniji se film dešava?', 'Osamdesetim', 'Šezdesetim', 'Sedamdesetim', 'Devedesetim'],
    ['Ko pobedi Apocalypsea na kraju?', 'Jean Grey', 'Magneto', 'Storm', 'Wolverine'],
    ['Šta se desi Xavieru?', 'Ostane ćelav', 'Izgubi moć', 'Umre', 'Postane zao']
  ],
  'logan': [
    ['Ko je Laura?', 'X-23, devojčica napravljena od Loganove DNK', 'Loganova sestra', 'Jean', 'Agentkinja'],
    ['Ko je X-24?', 'Loganov klon', 'Lauran brat', 'Sabretooth', 'Robot'],
    ['Ko ubije Charlesa?', 'X-24', 'Logan', 'Pierce', 'Rice'],
    ['Šta Laura stavi na Loganov grob?', 'Iskošen krst u obliku slova X', 'Kandže', 'Cvet', 'Šešir']
  ],
  'deadpool-2': [
    ['Ko je Cable?', 'Vojnik iz budućnosti', 'Colossusov brat', 'Mutant iz škole', 'Juggernaut'],
    ['Koga Cable hoće da ubije?', 'Russella (Firefist)', 'Deadpoola', 'Vanessu', 'Domino'],
    ['Kako Deadpool nazove svoj tim?', 'X-Force', 'X-Men', 'New Mutants', 'Deadpool Corps'],
    ['Ko jedina preživi skok padobranom?', 'Domino', 'Bedlam', 'Shatterstar', 'Peter']
  ],
  'dark-phoenix': [
    ['Šta Jean upije u svemiru?', 'Kosmičku silu', 'Kamen', 'Sunce', 'Simbiota'],
    ['Ko pogine od Jean?', 'Mystique', 'Xavier', 'Storm', 'Beast'],
    ['Ko su D\'Bari?', 'Vanzemaljci koji menjaju oblik', 'Mutanti', 'Kree', 'Roboti']
  ],
  'new-mutants': [
    ['Gde se dešava film?', 'U napuštenoj bolnici', 'U Xavierovoj školi', 'U zatvoru', 'Na ostrvu'],
    ['Šta Dani Moonstar ume?', 'Da strahove učini stvarnim', 'Da leti', 'Da se teleportuje', 'Da menja oblik'],
    ['Koje čudovište progoni Dani?', 'Demonski medved', 'Zmaj', 'Vuk', 'Sentinel']
  ],

  /* ---------------- Netflix ---------------- */

  'daredevil-s1': [
    ['Kako je Matt izgubio vid?', 'Hemikalije su ga zalile u nesreći kao dete', 'Rođen je slep', 'U borbi', 'Od eksplozije'],
    ['Ko je glavni negativac?', 'Wilson Fisk', 'Bullseye', 'Punisher', 'Nobu'],
    ['U kom delu Njujorka Matt čuva ulice?', 'Hell\'s Kitchen', 'Harlem', 'Bruklin', 'Kvins'],
    ['Ko je Mattov partner u advokatskoj firmi?', 'Foggy Nelson', 'Ben Urich', 'Stick', 'Frank'],
    ['Ko je Stick?', 'Mattov slepi učitelj', 'Njegov otac', 'Fiskov čovek', 'Policajac']
  ],
  'daredevil-s2': [
    ['Koji osvetnik sa lobanjom se pojavi?', 'Punisher', 'Bullseye', 'Ghost Rider', 'Blade'],
    ['Ko je Elektra?', 'Mattova bivša devojka', 'Fiskova ćerka', 'Karenina sestra', 'Agentkinja'],
    ['Kako se zove drevna nindža organizacija?', 'The Hand', 'Deset prstenova', 'Hidra', 'Chaste']
  ],
  'daredevil-s3': [
    ['Ko je Dex?', 'FBI agent koji postane Bullseye', 'Fiskov sin', 'Mattov brat', 'Punisher'],
    ['Ko izlazi iz zatvora i vraća se na vlast?', 'Wilson Fisk', 'Nobu', 'Madame Gao', 'Frank Castle'],
    ['Gde se Matt oporavlja na početku?', 'U sirotištu kod časnih sestara', 'U bolnici', 'Kod Foggyja', 'Kod Sticka']
  ],
  'jessica-jones-s1': [
    ['Ko je Kilgrave?', 'Čovek koji naređenjem kontroliše ljude', 'Jessicin bivši', 'Policajac', 'Vampir'],
    ['Šta je Jessica po zanimanju?', 'Privatni detektiv', 'Advokatica', 'Policajka', 'Novinarka'],
    ['Ko je Trish?', 'Jessicina najbolja drugarica', 'Njena sestra po krvi', 'Njena šefica', 'Kilgraveova žena'],
    ['Ko je čovek sa neprobojnom kožom?', 'Luke Cage', 'Danny Rand', 'Frank Castle', 'Matt Murdock']
  ],
  'jessica-jones-s2': [
    ['Ko se ispostavi da je živ?', 'Jessicina majka', 'Kilgrave', 'Njen otac', 'Will Simpson'],
    ['Ko je napravio Jessicine moći?', 'IGH', 'Hidra', 'Roxxon', 'The Hand'],
    ['Ko na kraju ubije Jessicinu majku?', 'Trish', 'Jessica', 'Malcolm', 'Policija']
  ],
  'jessica-jones-s3': [
    ['Ko je Sallinger?', 'Serijski ubica bez moći', 'Kilgrave', 'Trishin otac', 'Agent'],
    ['Šta Trish postane?', 'Osvetnica koja ubija kriminalce', 'Policajka', 'Advokatica', 'Jessicina partnerka'],
    ['Ko je Erik?', 'Čovek koji oseća da je neko loš', 'Jessicin brat', 'Sallingerov saradnik', 'Malcolm']
  ],
  'luke-cage-s1': [
    ['U kom delu Njujorka živi Luke?', 'Harlem', 'Hell\'s Kitchen', 'Bruklin', 'Bronks'],
    ['Ko je Cottonmouth?', 'Vlasnik kluba i šef kriminala', 'Lukeov brat', 'Policajac', 'Muzičar'],
    ['Ko je Diamondback?', 'Lukeov polubrat', 'Lukeov otac', 'Cottonmouthov šef', 'Policajac'],
    ['Kako je Luke dobio neprobojnu kožu?', 'Eksperimentom u zatvoru', 'Od rođenja', 'Od Kilgravea', 'U ratu']
  ],
  'luke-cage-s2': [
    ['Ko je Bushmaster?', 'Jamajčanin koji traži osvetu porodici Stokes', 'Lukeov brat', 'Diamondback', 'Policajac'],
    ['Ko na kraju preuzme Harlem\'s Paradise?', 'Luke', 'Mariah', 'Misty', 'Shades'],
    ['Šta se desi Mariah?', 'Otrovana je u zatvoru', 'Pobegne', 'Postane gradonačelnica', 'Ode u Jamajku']
  ],
  'iron-fist-s1': [
    ['Ko je Danny Rand?', 'Naslednik koji se vratio iz K\'un-Luna', 'Policajac', 'Nindža iz The Handa', 'Lukeov brat'],
    ['Šta je K\'un-Lun?', 'Mistični grad', 'Kompanija', 'Hram u Tibetu', 'Planeta'],
    ['Ko je Colleen Wing?', 'Učiteljica borilačkih veština', 'Dannyjeva sestra', 'Fiskova ćerka', 'Policajka'],
    ['Ko je Harold Meachum?', 'Partner Dannyjevog oca', 'Dannyjev ujak', 'Šef The Handa', 'Detektiv']
  ],
  'iron-fist-s2': [
    ['Ko ukrade moć Gvozdene pesnice?', 'Davos', 'Ward', 'Joy', 'Colleen'],
    ['Ko je Mary Walker (Typhoid)?', 'Žena sa više ličnosti', 'Dannyjeva sestra', 'Policajka', 'Nindža'],
    ['Ko na kraju dobije moć Gvozdene pesnice?', 'Colleen Wing', 'Ward', 'Davos', 'Misty']
  ],
  'defenders': [
    ['Ko su Defenders?', 'Daredevil, Jessica, Luke i Iron Fist', 'Osvetnici', 'Punisher i drugi', 'X-Men'],
    ['Ko vodi The Hand?', 'Alexandra', 'Fisk', 'Madame Gao', 'Bakuto'],
    ['Ko je „Black Sky“?', 'Elektra', 'Colleen', 'Jessica', 'Karen'],
    ['Šta padne na Matta na kraju?', 'Cela zgrada', 'Helikopter', 'Most', 'Voz']
  ],
  'punisher-s1': [
    ['Ko je Frank Castle?', 'Bivši marinac koji osvećuje porodicu', 'Policajac', 'Advokat', 'Haker'],
    ['Ko je Micro?', 'Haker David Lieberman', 'Frankov brat', 'Agent CIA', 'Billy'],
    ['Ko je Frankov izdajnik i bivši najbolji drug?', 'Billy Russo', 'Curtis', 'Micro', 'Rawlins']
  ],
  'punisher-s2': [
    ['U koga se pretvorio Billy Russo?', 'Jigsaw', 'Bullseye', 'Kingpin', 'Daredevil'],
    ['Koju devojčicu Frank štiti?', 'Amy', 'Karen', 'Lisa', 'Dinah'],
    ['Ko je John Pilgrim?', 'Plaćeni ubica verske prošlosti', 'Frankov brat', 'Policajac', 'Haker']
  ],

  /* ---------------- Marvel TV ---------------- */

  'agents-of-shield-s1': [
    ['Koji agent se vratio iz mrtvih?', 'Phil Coulson', 'Grant Ward', 'Melinda May', 'Nick Fury'],
    ['Kako se zove mlada hakerka u timu?', 'Skye', 'Jemma', 'Bobbi', 'Elena'],
    ['Ko se otkrije kao agent Hidre?', 'Grant Ward', 'Fitz', 'May', 'Trip'],
    ['Kako tim zove svoj avion?', 'Bus', 'Zephyr', 'Quinjet', 'Helikarijer']
  ],
  'agents-of-shield-s2': [
    ['Ko je Skye zapravo?', 'Daisy Johnson (Quake)', 'Coulsonova ćerka', 'Agentkinja Hidre', 'Kree'],
    ['Šta budi moći Inhumana?', 'Terrigen kristali', 'Serum', 'Kamen', 'Gama zraci'],
    ['Ko je Skyeina majka?', 'Jiaying', 'Melinda May', 'Raina', 'Bobbi']
  ],
  'agents-of-shield-s3': [
    ['Ko je Hive?', 'Drevni Inhuman parazit', 'Kree vojnik', 'Robot', 'Coulsonov klon'],
    ['Ko pogine u svemiru na kraju sezone?', 'Lincoln', 'Mack', 'Fitz', 'Coulson'],
    ['Na koju planetu Simmons upadne kroz monolit?', 'Maveth', 'Kree-Lar', 'Asgard', 'Hala']
  ],
  'agents-of-shield-s4': [
    ['Koji demon sa plamenom glavom se pojavljuje?', 'Ghost Rider (Robbie Reyes)', 'Blackheart', 'Mephisto', 'Hellstrom'],
    ['Ko je AIDA?', 'Android koji želi da postane čovek', 'Agentkinja', 'Kree', 'Inhuman'],
    ['Šta je Framework?', 'Virtuelni svet', 'Zatvor', 'Brod', 'Oružje']
  ],
  'agents-of-shield-s5': [
    ['Gde se tim probudi na početku?', 'U budućnosti, na uništenoj Zemlji', 'U prošlosti', 'Na Asgardu', 'U Frameworku'],
    ['Ko vlada Svetionikom (Lighthouse)?', 'Kree', 'Hidra', 'Skrulli', 'Chronicoms'],
    ['Ko na kraju postane Graviton?', 'General Talbot', 'Fitz', 'Mack', 'Coulson']
  ],
  'agents-of-shield-s6': [
    ['Ko je Sarge?', 'Čovek koji izgleda kao Coulson', 'Coulsonov brat', 'Kree', 'Fitz'],
    ['Ko su Chronicomi?', 'Roboti koji putuju kroz vreme', 'Inhumani', 'Kree vojnici', 'Agenti TVA'],
    ['Ko vodi S.H.I.E.L.D. posle Coulsona?', 'Mack', 'May', 'Daisy', 'Fitz']
  ],
  'agents-of-shield-s7': [
    ['Šta tim radi u poslednjoj sezoni?', 'Putuje kroz vreme kroz istoriju', 'Bori se sa Thanosom', 'Ide na Asgard', 'Ulazi u multiverzum'],
    ['U koju deceniju tim prvo skoči?', 'U tridesete', 'U šezdesete', 'U osamdesete', 'U dvehiljadite'],
    ['Ko je novi Coulson?', 'Chronicom (LMD) sa Coulsonovim umom', 'Klon', 'Sarge', 'Coulsonov sin']
  ],
  'agent-carter-s1': [
    ['U kojoj godini se serija dešava?', '1946.', '1962.', '1939.', '1975.'],
    ['Ko je Jarvis?', 'Batler Howarda Starka', 'Agent SSR', 'Peggyn brat', 'Negativac'],
    ['Za koju agenciju radi Peggy?', 'SSR', 'S.H.I.E.L.D.', 'CIA', 'Hidra'],
    ['Ko je Dottie?', 'Ruska ubica iz programa Udovica', 'Peggyna cimerka', 'Agentkinja SSR', 'Howardova sekretarica']
  ],
  'agent-carter-s2': [
    ['U koji grad Peggy ide u drugoj sezoni?', 'Los Anđeles', 'London', 'Čikago', 'Pariz'],
    ['Šta je Nulta materija?', 'Tamna supstanca iz druge dimenzije', 'Kamen', 'Serum', 'Bomba'],
    ['Ko je Whitney Frost?', 'Glumica koja postane negativka', 'Peggyna drugarica', 'Agentkinja', 'Jarvisova žena']
  ],
  'legion-s1': [
    ['Ko je David Haller?', 'Moćni mutant koji misli da je lud', 'Xavierov učenik', 'Doktor', 'Agent'],
    ['Šta se desi kad Syd nekog dodirne?', 'Zamene tela', 'Zaledi ga', 'Ubije ga', 'Postane nevidljiva'],
    ['Ko je parazit u Davidovom umu?', 'Shadow King', 'Apocalypse', 'Mystique', 'Mephisto']
  ],
  'legion-s2': [
    ['Kako se zove Shadow King?', 'Amahl Farouk', 'Oliver Bird', 'Cary Loudermilk', 'Clark'],
    ['Koju organizaciju David prati?', 'Division 3', 'S.H.I.E.L.D.', 'Hellfire Club', 'Hidra']
  ],
  'legion-s3': [
    ['Ko je Davidov otac?', 'Charles Xavier', 'Magneto', 'Shadow King', 'Cyclops'],
    ['Koju moć ima Switch?', 'Putuje kroz vreme', 'Leti', 'Čita misli', 'Menja oblik'],
    ['Šta David želi da uradi?', 'Da se vrati u prošlost i popravi sve', 'Da uništi svet', 'Da postane X-Men', 'Da pobedi Xaviera']
  ],
  'gifted-s1': [
    ['Kako se preziva porodica u centru priče?', 'Strucker', 'Summers', 'Grey', 'Maximoff'],
    ['Šta porodica otkrije o deci?', 'Da su mutanti', 'Da su Inhumani', 'Da su vanzemaljci', 'Da su Hidra'],
    ['Kako se zove grupa koja skriva mutante?', 'Mutant Underground', 'X-Men', 'Brotherhood', 'Morlocks']
  ],
  'gifted-s2': [
    ['Koja grupa vrbuje mutante u drugoj sezoni?', 'Inner Circle (Hellfire)', 'X-Men', 'Sentinel Services', 'Morlocks'],
    ['Ko su Frost sestre?', 'Trojke koje dele um', 'Agentkinje', 'Učiteljice', 'Policajke']
  ],
  'runaways-s1': [
    ['Šta deca otkriju o roditeljima?', 'Da su tajna zla grupa Pride', 'Da su Osvetnici', 'Da su vanzemaljci', 'Da su špijuni'],
    ['Šta je Old Lace?', 'Dinosaurus', 'Robot', 'Pas', 'Brod'],
    ['Ko je Jonah?', 'Vanzemaljac koji kontroliše Pride', 'Gertin otac', 'Učitelj', 'Policajac']
  ],
  'cloak-dagger-s1': [
    ['U kom gradu se serija dešava?', 'Nju Orleans', 'Njujork', 'Čikago', 'Majami'],
    ['Šta Tandy (Dagger) pravi?', 'Svetlosne bodeže', 'Senke', 'Led', 'Vatru'],
    ['Koja kompanija stoji iza nesreće koja im je dala moći?', 'Roxxon', 'Oscorp', 'Stark Industries', 'Hammer']
  ],
  'inhumans': [
    ['Ko je kralj Inhumana?', 'Black Bolt', 'Maximus', 'Karnak', 'Gorgon'],
    ['Zašto Black Bolt ne govori?', 'Njegov glas ruši sve', 'Nema jezik', 'Zakletva', 'Kletva'],
    ['Gde je Attilan?', 'Na Mesecu', 'Na Havajima', 'Pod morem', 'U svemiru'],
    ['Kako se zove ogromni pas koji teleportuje?', 'Lockjaw', 'Cosmo', 'Lucky', 'Goose']
  ],
  'helstrom': [
    ['Ko su Daimon i Ana?', 'Deca serijskog ubice', 'Lovci na vampire', 'Agenti', 'Mutanti'],
    ['Čime se Daimon bavi?', 'Profesor etike koji progoni demone', 'Policajac', 'Lekar', 'Sveštenik']
  ],

  /* ---------------- animacija ---------------- */

  'x-men-tas': [
    ['Ko vodi X-Mene na terenu?', 'Cyclops', 'Wolverine', 'Storm', 'Beast'],
    ['Kako se zovu džinovski roboti koji love mutante?', 'Sentineli', 'Ultroni', 'Chitauri', 'Doombotovi'],
    ['Koji Cajun mutant baca naelektrisane karte?', 'Gambit', 'Bishop', 'Morph', 'Jubilee']
  ],
  'x-men-97-s1': [
    ['Koga Xavier ostavi da vodi X-Mene?', 'Magneta', 'Cyclopsa', 'Storm', 'Wolverinea'],
    ['Koje ostrvo mutanata napadnu Sentineli?', 'Genosha', 'Krakoa', 'Madripur', 'Muir'],
    ['Ko je Madelyne Pryor?', 'Jeanin klon', 'Scottova sestra', 'Mystique', 'Rogue'],
    ['Ko je Bastion?', 'Pola mutant, pola Sentinel', 'Magnetov sin', 'Xavierov brat', 'Apocalypse']
  ],
  'modok': [
    ['Koju organizaciju vodi M.O.D.O.K.?', 'A.I.M.', 'Hidra', 'Deset prstenova', 'Roxxon'],
    ['Po čemu se M.O.D.O.K. odmah prepoznaje?', 'Ogromna glava na malom telu', 'Nevidljiv je', 'Glava mu gori', 'Ima četiri ruke'],
    ['Ko želi da preuzme A.I.M. od njega?', 'GRUMBL (tehnološka firma)', 'Hidra', 'Iron Man', 'Thanos']
  ],
  'hit-monkey-s1': [
    ['Ko je Hit-Monkey?', 'Japanski majmun ubica', 'Robot', 'Mutant', 'Ninja'],
    ['Čiji duh prati Hit-Monkeyja?', 'Duh plaćenog ubice Brycea', 'Duh njegovog oca', 'Duh samuraja', 'Duh Ultrona'],
    ['U kojoj zemlji se dešava prva sezona?', 'U Japanu', 'U Kini', 'U Americi', 'U Indiji']
  ],

  /* ---------------- klasici ---------------- */

  'howard-the-duck': [
    ['Odakle dolazi Howard?', 'Sa planete patki', 'Iz Asgarda', 'Iz laboratorije', 'Iz zoološkog vrta'],
    ['U koji grad Howard pada?', 'Klivlend', 'Njujork', 'Čikago', 'Los Anđeles'],
    ['Ko je Beverly?', 'Pevačica koju Howard spase', 'Naučnica', 'Agentkinja', 'Njegova sestra']
  ],
  'blade': [
    ['Kako vampiri zovu Bladea?', 'Daywalker', 'Nightstalker', 'Lovac', 'Vampir kralj'],
    ['Ko je glavni negativac?', 'Deacon Frost', 'Drake', 'Nomak', 'Damaskinos'],
    ['Ko je Bladeov mentor?', 'Whistler', 'Karen', 'King', 'Quinn']
  ],
  'blade-2': [
    ['Ko su Reaperi?', 'Mutirani vampiri koji jedu vampire', 'Lovci', 'Ljudi', 'Vukodlaci'],
    ['Sa kim Blade sklapa savez?', 'Sa vampirima', 'Sa S.H.I.E.L.D.-om', 'Sa policijom', 'Sa vukodlacima'],
    ['Ko je Nomak?', 'Prvi Reaper', 'Whistler', 'Bladeov otac', 'Vampir kralj']
  ],
  'blade-trinity': [
    ['Kog drevnog vampira bude?', 'Drakulu (Drake)', 'Frosta', 'Nomaka', 'Morbiusa'],
    ['Kako se zove tim lovaca koji pomaže Bladeu?', 'Nightstalkers', 'Defenders', 'Thunderbolts', 'Reaperi'],
    ['Ko je Abigail?', 'Whistlerova ćerka', 'Bladeova sestra', 'Vampirka', 'Agentkinja']
  ],
  'daredevil-2003': [
    ['Ko glumi Daredevila?', 'Ben Affleck', 'Charlie Cox', 'Matt Damon', 'Colin Farrell'],
    ['Ko je Bullseye?', 'Ubica koji pogađa sve što baci', 'Kingpinov sin', 'Policajac', 'Elektrin brat'],
    ['Ko je Elektra?', 'Mattova devojka', 'Njegova sestra', 'Kingpinova ćerka', 'Advokatica']
  ],
  'hulk-2003': [
    ['Ko glumi Brucea u ovom filmu?', 'Eric Bana', 'Edward Norton', 'Mark Ruffalo', 'Ben Affleck'],
    ['Ko je Bruceov otac?', 'David Banner, naučnik', 'General Ross', 'Talbot', 'Stark'],
    ['Šta je posebno kod montaže filma?', 'Ekran se deli kao stranice stripa', 'Crno-beli je', 'Animiran je', 'Nema muzike']
  ],
  'punisher-2004': [
    ['Ko glumi Punishera?', 'Thomas Jane', 'Jon Bernthal', 'Dolph Lundgren', 'Ray Stevenson'],
    ['Ko je glavni negativac?', 'Howard Saint', 'Jigsaw', 'Kingpin', 'Billy Russo'],
    ['Zašto Frank postane Punisher?', 'Ubijena mu je porodica', 'Izbačen je iz vojske', 'Zbog novca', 'Zbog Daredevila']
  ],
  'elektra': [
    ['Ko glumi Elektru?', 'Jennifer Garner', 'Scarlett Johansson', 'Jessica Alba', 'Halle Berry'],
    ['Koja organizacija je juri?', 'The Hand', 'Hidra', 'S.H.I.E.L.D.', 'Deset prstenova'],
    ['Koga Elektra štiti?', 'Devojčicu Abby i njenog oca', 'Daredevila', 'Kingpina', 'Sticka']
  ],
  'fantastic-four-2005': [
    ['Kako Četvorka dobije moći?', 'Kosmičkom olujom u svemiru', 'Gama bombom', 'Serumom', 'Kamenom'],
    ['Ko je Victor von Doom?', 'Reedov rival i Suin bivši', 'Benov brat', 'Kree', 'Galactus'],
    ['Ko glumi Johnnyja Storma?', 'Chris Evans', 'Chris Pratt', 'Michael B. Jordan', 'Joseph Quinn']
  ],
  'rise-of-the-silver-surfer': [
    ['Za koga radi Silver Surfer?', 'Za Galactusa', 'Za Dooma', 'Za Kree', 'Za Thanosa'],
    ['Čije venčanje se stalno prekida?', 'Reeda i Sue', 'Bena i Alicie', 'Johnnyja', 'Dooma'],
    ['Kako izgleda Galactus u ovom filmu?', 'Kao ogroman kosmički oblak', 'Kao div u kacigi', 'Kao planeta', 'Kao robot']
  ],
  'ghost-rider': [
    ['Ko glumi Johnnyja Blazea?', 'Nicolas Cage', 'Keanu Reeves', 'Johnny Depp', 'Ryan Reynolds'],
    ['Kome Johnny proda dušu?', 'Mefistu', 'Blackheartu', 'Dormammuu', 'Drakuli'],
    ['Šta Johnny vozi?', 'Motor', 'Auto', 'Konja', 'Kamion']
  ],
  'ghost-rider-2': [
    ['Koga Johnny štiti?', 'Dečaka Dannyja', 'Mefista', 'Roxanne', 'Moreaua'],
    ['Gde se film dešava?', 'U istočnoj Evropi', 'U Teksasu', 'U Njujorku', 'U Japanu']
  ],
  'punisher-war-zone': [
    ['Ko glumi Punishera?', 'Ray Stevenson', 'Thomas Jane', 'Jon Bernthal', 'Dolph Lundgren'],
    ['Ko postane Jigsaw?', 'Billy Russoti', 'Howard Saint', 'Micro', 'Loony Bin Jim']
  ],
  'fantastic-four-2015': [
    ['Gde dobiju moći?', 'Na drugoj dimenziji (Planeta Nula)', 'U svemiru', 'U laboratoriji', 'U kvantnom carstvu'],
    ['Ko glumi Reeda?', 'Miles Teller', 'Ioan Gruffudd', 'Pedro Pascal', 'Chris Evans']
  ]
};
