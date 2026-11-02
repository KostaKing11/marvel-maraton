/* ============================================================
   games.js  -  mini igre (tab Igre)
   ------------------------------------------------------------
   Svaka igra ima 20 nivoa (predjen nivo daje XP) i beskonacni mod. Klasika su
   prve tri zaredom (Dooma, Kamenje, Kviz). Igra se crta sama u
   kontejner sa data-keep (morph je ne dira).
   ============================================================ */
window.MM = window.MM || {};

(function () {
  'use strict';

  var UI = MM.UI, esc = UI.esc;

  var QUIZ = [
    ['Koji MCU film je izašao prvi?', ['The Incredible Hulk', 'Iron Man', 'Thor', 'Captain America: The First Avenger'], 1],
    ['Koji kamen je bio u Lokijevom žezlu?', ['Kamen prostora', 'Kamen moći', 'Kamen uma', 'Kamen duše'], 2],
    ['Kako se zove Thorov drugi čekić (sekira)?', ['Mjolnir', 'Stormbreaker', 'Gungnir', 'Jarnbjorn'], 1],
    ['Šta Tony Stark kaže pre pucnja prstima u Endgameu?', ['I am Iron Man', 'Avengers, assemble', 'I love you 3000', 'We have a Hulk'], 0],
    ['Koliko je kamenja beskonačnosti?', ['5', '6', '7', '4'], 1],
    ['Gde je Thanos dobio kamen duše?', ['Xandar', 'Vormir', 'Titan', 'Knowhere'], 1],
    ['Ko glumi Doctor Dooma u Avengers: Doomsday?', ['Chris Evans', 'Robert Downey Jr.', 'Pedro Pascal', 'Tom Hiddleston'], 1],
    ['Kako se zove Peter Quillova kaseta?', ['Awesome Mix Vol. 1', 'Star-Lord Hits', 'Guardians Mix', 'Terra Tapes'], 0],
    ['Ko je napravio Ultrona?', ['Tony i Bruce', 'Hank Pym', 'Thanos', 'Loki'], 0],
    ['Kako se zove Wakandin metal?', ['Adamantijum', 'Vibranijum', 'Uru', 'Karbonadijum'], 1],
    ['Šta je TVA u Lokiju?', ['Time Variance Authority', 'Time Vault Agency', 'Total Void Army', 'The Variant Alliance'], 0],
    ['Ko je Bucky postao posle Winter Soldiera?', ['White Wolf', 'Falcon', 'U.S. Agent', 'Red Guardian'], 0],
    ['Koji film je odmah posle Infinity War po izlasku?', ['Endgame', 'Ant-Man and the Wasp', 'Captain Marvel', 'Black Panther'], 1],
    ['Kako Dr Strange pobeđuje Dormammua?', ['Vremenskom petljom', 'Kamenom moći', 'Mjolnirom', 'Darkholdom'], 0],
    ['Ko je otac Gamore?', ['Ego', 'Thanos', 'Ronan', 'Yondu'], 1],
    ['Koliko filmova ima Infinity Saga?', ['21', '22', '23', '20'], 2],
    ['Koji je prvi film MCU Faze 4?', ['WandaVision', 'Black Widow', 'Shang-Chi', 'Eternals'], 1],
    ['Kako se zove Kangova varijanta na kraju Loki S1?', ['He Who Remains', 'Immortus', 'Rama-Tut', 'Victor Timely'], 0],
    ['Ko je Yelenin "otac" u Black Widow?', ['Red Guardian', 'Taskmaster', 'Dreykov', 'Winter Soldier'], 0],
    ['Šta znači S.H.I.E.L.D. (prva reč)?', ['Strategic', 'Supreme', 'Special', 'Secret'], 0],
    ['Kako se zove AI koji je zamenio J.A.R.V.I.S.-a?', ['F.R.I.D.A.Y.', 'E.D.I.T.H.', 'K.A.R.E.N.', 'Ultron'], 0],
    ['U kom gradu je bila bitka u The Avengers?', ['Njujork', 'Vašington', 'London', 'Sokovija'], 0],
    ['Koliko godina je Steve Rogers bio zamrznut?', ['~50', '~70', '~90', '~30'], 1],
    ['Ko je ubio Gamoru (Infinity War)?', ['Thanos', 'Nebula', 'Ronan', 'Ebony Maw'], 0],
    ['Kako se zove Thorova sestra?', ['Hela', 'Sif', 'Frigga', 'Valkyrie'], 0],
    ['Koje je pravo ime Black Panthera?', ["T'Challa", "N'Jadaka", "M'Baku", "T'Chaka"], 0],
    ['Ko je glumio Kanga (Quantumania)?', ['Jonathan Majors', 'Josh Brolin', 'Oscar Isaac', 'Mahershala Ali'], 0],
    ['Kako se zove Spider-Manov prijatelj u MCU?', ['Ned', 'Harry', 'Flash', 'Miles'], 0],
    ['Ko je napravio Visionovo telo?', ['Ultron', 'Hank Pym', 'Shuri', 'Wanda'], 0],
    ['Kako se zove TVA agent u Deadpool & Wolverine?', ['Paradox', 'Mobius', 'B-15', 'Casey'], 0],
    ['U kojoj zemlji je Sokovija (u priči)?', ['Istočna Evropa', 'Južna Amerika', 'Afrika', 'Azija'], 0],
    ['Kako se zove Rocketov najbolji drug?', ['Groot', 'Drax', 'Kraglin', 'Yondu'], 0],
    ['Ko kaže "Avengers, assemble" u Endgameu?', ['Captain America', 'Iron Man', 'Thor', 'Nick Fury'], 0],
    ['Kako se zove brod Guardiansa (prvi film)?', ['Milano', 'Benatar', 'Bowie', 'Eclector'], 0],
    ['Šta Groot uvek kaže?', ['I am Groot', 'We are Groot', 'Groot!', 'I am Tree'], 0],
    ['Kako se zove Tonyjeva ćerka?', ['Morgan', 'Pepper', 'Harley', 'Riri'], 0],
    ['Ko je Peter Parkerova tetka?', ['May', 'Martha', 'Mary', 'Maggie'], 0],
    ['Šta je Wanda napravila u Westviewu?', ['TV serijsku stvarnost', 'Vremensku petlju', 'Portal', 'Robota'], 0],
    ['Ko je prvi Captain Marvel u MCU?', ['Carol Danvers', 'Monica Rambeau', 'Kamala Khan', 'Mar-Vell'], 0],
    ['Ko je Thanosova "ćerka" sa plavom kožom?', ['Nebula', 'Gamora', 'Mantis', 'Proxima'], 0],
    ['Kako se zove Hulk kad priča i nosi naočare?', ['Smart Hulk', 'Professor Hulk', 'Grey Hulk', 'Joe Fixit'], 0],
    ['Gde je Black Widow žrtvovala sebe?', ['Vormir', 'Titan', 'Wakanda', 'Asgard'], 0],
    ['Koji bend se čuje kroz ceo Thor: Love and Thunder?', ['Guns N\' Roses', 'Queen', 'AC/DC', 'Led Zeppelin'], 0],
    ['Kako se zove Lokijev aligator?', ['Alligator Loki', 'Croki', 'Gator Loki', 'Kid Loki'], 0],
    ['Koje boje je Kamen vremena?', ['Zelen', 'Plav', 'Crven', 'Ljubičast'], 0],
    ['Ko je napravio Iron Man odelo u pećini?', ['Tony uz Yinsena', 'Pepper', 'Obadiah', 'Rhodey'], 0],
    ['Kako se zove Wakandin kralj u Wakanda Forever na kraju?', ['Shuri (kao Black Panther)', "M'Baku", 'Ramonda', 'Okoye'], 0],
    ['Kako Ant-Man ulazi u kvantni svet?', ['Smanji se', 'Kroz portal', 'Teleportom', 'Kamenom'], 0],
    ['Ko je Deadpoolova Wolverine varijanta (glumac)?', ['Hugh Jackman', 'Henry Cavill', 'Chris Evans', 'Ryan Reynolds'], 0],
    ['Ko glumi Iron Mana?', ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo', 'Jeremy Renner'], 0],
    ['Ko glumi Captain Americu (Steve Rogers)?', ['Chris Evans', 'Chris Pratt', 'Chris Hemsworth', 'Sebastian Stan'], 0],
    ['Ko glumi Thora?', ['Chris Hemsworth', 'Chris Pratt', 'Tom Hiddleston', 'Liam Hemsworth'], 0],
    ['Ko glumi Lokija?', ['Tom Hiddleston', 'Tom Holland', 'Benedict Cumberbatch', 'Paul Bettany'], 0],
    ['Ko glumi Black Widow (Natasha)?', ['Scarlett Johansson', 'Elizabeth Olsen', 'Brie Larson', 'Florence Pugh'], 0],
    ['Ko glumi Hulka od The Avengers (2012)?', ['Mark Ruffalo', 'Edward Norton', 'Eric Bana', 'Lou Ferrigno'], 0],
    ['Ko je glumio Brucea Bannera u The Incredible Hulk (2008)?', ['Edward Norton', 'Mark Ruffalo', 'Eric Bana', 'Tim Roth'], 0],
    ['Ko glumi Hawkeyea?', ['Jeremy Renner', 'Jon Bernthal', 'Sebastian Stan', 'Anthony Mackie'], 0],
    ['Ko glumi Wandu Maximoff?', ['Elizabeth Olsen', 'Scarlett Johansson', 'Hailee Steinfeld', 'Zendaya'], 0],
    ['Ko glumi Doctor Strangea?', ['Benedict Cumberbatch', 'Tom Hiddleston', 'Oscar Isaac', 'Paul Bettany'], 0],
    ['Ko je glumio T\'Challu (Black Panther)?', ['Chadwick Boseman', 'Michael B. Jordan', 'Daniel Kaluuya', 'Winston Duke'], 0],
    ['Ko glumi Killmongera?', ['Michael B. Jordan', 'Chadwick Boseman', 'Mahershala Ali', 'John Boyega'], 0],
    ['Ko glumi Star-Lorda?', ['Chris Pratt', 'Chris Evans', 'Dave Bautista', 'Paul Rudd'], 0],
    ['Ko glumi Thanosa?', ['Josh Brolin', 'Dave Bautista', 'Idris Elba', 'Jason Momoa'], 0],
    ['Ko daje glas Rocketu?', ['Bradley Cooper', 'Vin Diesel', 'Sean Gunn', 'Ryan Reynolds'], 0],
    ['Ko daje glas Grootu?', ['Vin Diesel', 'Bradley Cooper', 'Dwayne Johnson', 'Dave Bautista'], 0],
    ['Ko glumi Draxa?', ['Dave Bautista', 'Vin Diesel', 'Jason Momoa', 'John Cena'], 0],
    ['Ko glumi Spider-Mana u MCU?', ['Tom Holland', 'Andrew Garfield', 'Tobey Maguire', 'Tom Hiddleston'], 0],
    ['Ko glumi Captain Marvel (Carol Danvers)?', ['Brie Larson', 'Teyonah Parris', 'Iman Vellani', 'Elizabeth Olsen'], 0],
    ['Ko glumi Ant-Mana (Scott Lang)?', ['Paul Rudd', 'Michael Douglas', 'Chris Pratt', 'Ryan Reynolds'], 0],
    ['Ko glumi Nicka Furyja?', ['Samuel L. Jackson', 'Don Cheadle', 'Laurence Fishburne', 'Idris Elba'], 0],
    ['Ko glumi Deadpoola?', ['Ryan Reynolds', 'Hugh Jackman', 'Chris Pratt', 'Ryan Gosling'], 0],
    ['Ko glumi Shang-Chija?', ['Simu Liu', 'Kumail Nanjiani', 'Tony Leung', 'Ke Huy Quan'], 0],
    ['Ko glumi Moon Knighta?', ['Oscar Isaac', 'Pedro Pascal', 'Ethan Hawke', 'Jake Gyllenhaal'], 0],
    ['Ko glumi Ms. Marvel (Kamala Khan)?', ['Iman Vellani', 'Hailee Steinfeld', 'Xochitl Gomez', 'Dominique Thorne'], 0],
    ['Ko glumi She-Hulk?', ['Tatiana Maslany', 'Brie Larson', 'Kat Dennings', 'Kathryn Hahn'], 0],
    ['Ko glumi Kate Bishop?', ['Hailee Steinfeld', 'Florence Pugh', 'Zendaya', 'Iman Vellani'], 0],
    ['Ko glumi Yelenu Belovu?', ['Florence Pugh', 'Scarlett Johansson', 'Hailee Steinfeld', 'Olga Kurylenko'], 0],
    ['Ko glumi Buckyja Barnesa?', ['Sebastian Stan', 'Anthony Mackie', 'Chris Evans', 'Wyatt Russell'], 0],
    ['Ko glumi Sama Wilsona (Falcon)?', ['Anthony Mackie', 'Don Cheadle', 'Sebastian Stan', 'Chadwick Boseman'], 0],
    ['Ko glumi Visiona?', ['Paul Bettany', 'James Spader', 'Tom Hiddleston', 'Benedict Cumberbatch'], 0],
    ['Ko glumi Mobiusa u Lokiju?', ['Owen Wilson', 'Ke Huy Quan', 'Jonathan Majors', 'Richard E. Grant'], 0],
    ['Ko glumi Daredevila (Matt Murdock)?', ['Charlie Cox', 'Ben Affleck', 'Jon Bernthal', 'Finn Jones'], 0],
    ['Ko glumi Punishera u Netflix serijama?', ['Jon Bernthal', 'Thomas Jane', 'Dolph Lundgren', 'Ray Stevenson'], 0],
    ['Ko glumi Kingpina?', ['Vincent D\'Onofrio', 'Michael Clarke Duncan', 'Jon Bernthal', 'Mahershala Ali'], 0],
    ['Ko glumi Reeda Richardsa u The Fantastic Four: First Steps?', ['Pedro Pascal', 'John Krasinski', 'Ioan Gruffudd', 'Miles Teller'], 0],
    ['Ko glumi Sue Storm u First Steps?', ['Vanessa Kirby', 'Jessica Alba', 'Kate Mara', 'Julia Garner'], 0],
    ['Ko glumi Galactusa u First Steps?', ['Ralph Ineson', 'Javier Bardem', 'Idris Elba', 'Mark Strong'], 0],
    ['Ko glumi Silver Surfer u First Steps?', ['Julia Garner', 'Vanessa Kirby', 'Elizabeth Olsen', 'Florence Pugh'], 0],
    ['Ko glumi mladog Magnetoa (First Class)?', ['Michael Fassbender', 'James McAvoy', 'Ian McKellen', 'Kevin Bacon'], 0],
    ['Ko glumi mladog Profesora X?', ['James McAvoy', 'Michael Fassbender', 'Patrick Stewart', 'Nicholas Hoult'], 0],
    ['Ko glumi Mystique u First Class?', ['Jennifer Lawrence', 'Rebecca Romijn', 'Sophie Turner', 'Halle Berry'], 0],
    ['Ko glumi Eddieja Brocka (Venom)?', ['Tom Hardy', 'Topher Grace', 'Woody Harrelson', 'Riz Ahmed'], 0],
    ['Ko je glumio Rossa (Red Hulk) u Brave New World?', ['Harrison Ford', 'William Hurt', 'Tim Roth', 'Liam Neeson'], 0],
    ['Ko je glumio Zevsa u Thor: Love and Thunder?', ['Russell Crowe', 'Christian Bale', 'Anthony Hopkins', 'Jeff Goldblum'], 0],
    ['Ko je glumio Gorra u Thor: Love and Thunder?', ['Christian Bale', 'Russell Crowe', 'Jeff Goldblum', 'Cate Blanchett'], 0],
    ['Ko režira Avengers: Endgame?', ['Braća Russo', 'Joss Whedon', 'Jon Favreau', 'James Gunn'], 0],
    ['Ko je režirao The Avengers (2012)?', ['Joss Whedon', 'Braća Russo', 'Jon Favreau', 'Kenneth Branagh'], 0],
    ['Ko je režirao Iron Man (2008)?', ['Jon Favreau', 'Shane Black', 'Joss Whedon', 'Jon Watts'], 0],
    ['Ko je režirao Guardians of the Galaxy?', ['James Gunn', 'Taika Waititi', 'Peyton Reed', 'Ryan Coogler'], 0],
    ['Ko je režirao Thor: Ragnarok?', ['Taika Waititi', 'Kenneth Branagh', 'Alan Taylor', 'James Gunn'], 0],
    ['Ko je režirao Black Panther?', ['Ryan Coogler', 'Chloé Zhao', 'Jon Watts', 'Destin Daniel Cretton'], 0],
    ['Ko je glavni šef Marvel Studija?', ['Kevin Feige', 'Stan Lee', 'Bob Iger', 'Jon Favreau'], 0],
    ['Ko se pojavljivao kao kameo u skoro svakom Marvel filmu?', ['Stan Lee', 'Kevin Feige', 'Jack Kirby', 'Steve Ditko'], 0],
    ['Kako se zove Thorov rodni svet?', ['Asgard', 'Jotunheim', 'Vanaheim', 'Xandar'], 0],
    ['Ko je Thorov otac?', ['Odin', 'Bor', 'Laufey', 'Heimdall'], 0],
    ['Ko je Thorova majka?', ['Frigga', 'Hela', 'Sif', 'Jane'], 0],
    ['Ko čuva Bifrost?', ['Heimdall', 'Sif', 'Volstagg', 'Odin'], 0],
    ['Ko je Lokijev biološki otac?', ['Laufey', 'Odin', 'Surtur', 'Thanos'], 0],
    ['Ko je T\'Challina sestra?', ['Shuri', 'Okoye', 'Nakia', 'Ramonda'], 0],
    ['Ko je vođa Dora Milaje?', ['Okoye', 'Nakia', 'Shuri', 'Ayo'], 0],
    ['Kako se zove podvodno kraljevstvo u Wakanda Forever?', ['Talokan', 'Atlantida', 'Lemurija', 'Xibalba'], 0],
    ['Ko vlada Talokanom?', ['Namor', 'Attuma', 'Killmonger', 'M\'Baku'], 0],
    ['Kako se zove Starkova firma?', ['Stark Industries', 'Oscorp', 'Pym Tech', 'Roxxon'], 0],
    ['Kako se zvao Starkov AI pre F.R.I.D.A.Y.?', ['J.A.R.V.I.S.', 'E.D.I.T.H.', 'K.A.R.E.N.', 'Ultron'], 0],
    ['Ko je negativac u Iron Man (2008)?', ['Obadiah Stane', 'Ivan Vanko', 'Aldrich Killian', 'Justin Hammer'], 0],
    ['Ko je negativac u Iron Man 2?', ['Ivan Vanko (Whiplash)', 'Obadiah Stane', 'Aldrich Killian', 'Mandarin'], 0],
    ['Ko se pravi da je Mandarin u Iron Man 3?', ['Trevor Slattery', 'Aldrich Killian', 'Wenwu', 'Justin Hammer'], 0],
    ['Ko je pravi negativac u Iron Man 3?', ['Aldrich Killian', 'Trevor Slattery', 'Obadiah Stane', 'Ivan Vanko'], 0],
    ['Od kog metala je Capov štit?', ['Vibranijum', 'Adamantijum', 'Uru', 'Titanijum'], 0],
    ['Ko je bila Steveova ljubav u Drugom svetskom ratu?', ['Peggy Carter', 'Sharon Carter', 'Natasha', 'Maria Hill'], 0],
    ['Ko je Red Skull?', ['Johann Schmidt', 'Arnim Zola', 'Baron Zemo', 'Alexander Pierce'], 0],
    ['Ko je napravio serum supervojnika?', ['Dr. Abraham Erskine', 'Howard Stark', 'Arnim Zola', 'Hank Pym'], 0],
    ['Ko je glavni negativac u The Winter Soldier?', ['Alexander Pierce', 'Red Skull', 'Baron Zemo', 'Crossbones'], 0],
    ['Ko dobija Capov štit na kraju Endgamea?', ['Sam Wilson', 'Bucky Barnes', 'John Walker', 'Peter Parker'], 0],
    ['Ko gine u Avengers: Age of Ultron?', ['Pietro Maximoff', 'Clint Barton', 'Vision', 'Wanda Maximoff'], 0],
    ['Ko uništava poslednjeg Ultrona?', ['Vision', 'Iron Man', 'Thor', 'Hulk'], 0],
    ['U kom filmu se Spider-Man prvi put pojavljuje u MCU?', ['Captain America: Civil War', 'Spider-Man: Homecoming', 'The Avengers', 'Iron Man 3'], 0],
    ['U kom filmu se Black Panther prvi put pojavljuje?', ['Captain America: Civil War', 'Black Panther', 'Age of Ultron', 'Infinity War'], 0],
    ['Ko je negativac u Captain America: Civil War?', ['Helmut Zemo', 'Red Skull', 'Crossbones', 'Alexander Pierce'], 0],
    ['Ko je negativac u Spider-Man: Homecoming?', ['Vulture', 'Mysterio', 'Green Goblin', 'Scorpion'], 0],
    ['Ko je negativac u Spider-Man: Far From Home?', ['Mysterio', 'Vulture', 'Electro', 'Kraven'], 0],
    ['Ko otkriva svetu da je Peter Parker Spider-Man?', ['Mysterio (snimak)', 'Vulture', 'Flash', 'Ned'], 0],
    ['Ko se vraća kao Spider-Man u No Way Home?', ['Tobey Maguire i Andrew Garfield', 'Miles i Gwen', 'Spider-Noir i Spider-Ham', 'Niko'], 0],
    ['Ko glumi MJ u MCU Spider-Man filmovima?', ['Zendaya', 'Kirsten Dunst', 'Emma Stone', 'Hailee Steinfeld'], 0],
    ['Ko baca čini da svi zaborave Petera u No Way Home?', ['Doctor Strange', 'Wong', 'Wanda', 'Loki'], 0],
    ['Ko je Vrhovni čarobnjak posle Blipa?', ['Wong', 'Doctor Strange', 'Mordo', 'Ancient One'], 0],
    ['Ko je negativac u Doctor Strange (2016)?', ['Kaecilius', 'Mordo', 'Dormammu sam', 'Nightmare'], 0],
    ['Ko je negativac u Multiverse of Madness?', ['Scarlet Witch', 'Mordo', 'Gargantos', 'Strange Supreme'], 0],
    ['Kako se zove devojka koja putuje kroz multiverzum u Multiverse of Madness?', ['America Chavez', 'Kate Bishop', 'Kamala Khan', 'Cassie Lang'], 0],
    ['Ko je Gamorina sestra?', ['Nebula', 'Mantis', 'Proxima', 'Ayesha'], 0],
    ['Ko je Quillov biološki otac?', ['Ego', 'Yondu', 'Kraglin', 'Thanos'], 0],
    ['Ko je odveo Quilla sa Zemlje kao dete?', ['Yondu', 'Ego', 'Ronan', 'Rocket'], 0],
    ['Ko je negativac u Guardians of the Galaxy (2014)?', ['Ronan', 'Ego', 'Thanos', 'High Evolutionary'], 0],
    ['Ko je negativac u Guardians of the Galaxy Vol. 3?', ['High Evolutionary', 'Ego', 'Adam Warlock', 'Ayesha'], 0],
    ['Kako se zove pas-astronaut u Guardians?', ['Cosmo', 'Lucky', 'Goose', 'Rocket'], 0],
    ['Šta Drax ne razume?', ['Metafore', 'Matematiku', 'Muziku', 'Ples'], 0],
    ['Koju moć ima Mantis?', ['Oseća i menja emocije', 'Leti', 'Teleportuje se', 'Čita misli'], 0],
    ['Ko je negativac u Ant-Man (2015)?', ['Yellowjacket', 'Ghost', 'Kang', 'Sonny Burch'], 0],
    ['Ko je Ant-Manov mentor?', ['Hank Pym', 'Tony Stark', 'Bill Foster', 'Luis'], 0],
    ['Kako se zove Hankova ćerka (Wasp)?', ['Hope', 'Cassie', 'Janet', 'Ava'], 0],
    ['Kako se zove Scottova ćerka?', ['Cassie', 'Hope', 'Morgan', 'Kate'], 0],
    ['Ko je negativac u Ant-Man and the Wasp?', ['Ghost', 'Yellowjacket', 'Kang', 'MODOK'], 0],
    ['Ko je Captain Marvelin Kree mentor?', ['Yon-Rogg', 'Ronan', 'Talos', 'Korath'], 0],
    ['Koja rasa menja oblik u Captain Marvel?', ['Skrulovi', 'Kree', 'Chitauri', 'Sakaarijanci'], 0],
    ['Kako se zove Skrul saveznik u Captain Marvel?', ['Talos', 'Gravik', 'Yon-Rogg', 'Ronan'], 0],
    ['Kako je Nick Fury izgubio oko?', ['Ogrebala ga mačka Goose', 'U borbi sa Hydrom', 'Eksplozija', 'Rođen je tako'], 0],
    ['U kojoj deceniji se dešava Captain Marvel?', ['90-e', '80-e', '70-e', '2000-e'], 0],
    ['Ko je uzor Kamali Khan?', ['Captain Marvel', 'Iron Man', 'Spider-Man', 'Black Widow'], 0],
    ['U kom gradu živi Kamala Khan?', ['Jersey City', 'Njujork', 'Čikago', 'Boston'], 0],
    ['Ko je mentor Kate Bishop?', ['Clint Barton', 'Natasha', 'Yelena', 'Nick Fury'], 0],
    ['Kako se zove pas u Hawkeye seriji?', ['Lucky', 'Cosmo', 'Goose', 'Dug'], 0],
    ['Šta je posebno kod Maye Lopez (Echo)?', ['Gluva je', 'Slepa je', 'Leti', 'Mutant je'], 0],
    ['Ko je Shang-Chijev otac?', ['Wenwu', 'Wong', 'Razor Fist', 'Trevor'], 0],
    ['Kako se zove skriveno selo u Shang-Chiju?', ['Ta Lo', 'K\'un-Lun', 'Kamar-Taj', 'Wakanda'], 0],
    ['Ko je vođa Eternala na Zemlji?', ['Ajak', 'Sersi', 'Ikaris', 'Thena'], 0],
    ['Kako se zove Celestial koji raste u Zemlji (Eternals)?', ['Tiamut', 'Arishem', 'Ego', 'Galactus'], 0],
    ['Kako se zove Moon Knightova blaga ličnost (prodavac u muzeju)?', ['Steven Grant', 'Marc Spector', 'Jake Lockley', 'Arthur Harrow'], 0],
    ['Kog egipatskog boga služi Moon Knight?', ['Khonshu', 'Ammit', 'Ra', 'Anubis'], 0],
    ['Kako se zove She-Hulk?', ['Jennifer Walters', 'Betty Ross', 'Jessica Jones', 'Karen Page'], 0],
    ['Šta je Jennifer Walters po zanimanju?', ['Advokatica', 'Lekarka', 'Novinarka', 'Policajka'], 0],
    ['Ko je Werewolf by Night?', ['Jack Russell', 'Elsa Bloodstone', 'Ulysses', 'Man-Thing'], 0],
    ['Ko je glavni negativac u Secret Invasion?', ['Gravik', 'Talos', 'Kang', 'Zemo'], 0],
    ['Kako se zovu Wandini sinovi?', ['Billy i Tommy', 'Peter i Ned', 'Scott i Hank', 'Luke i Danny'], 0],
    ['Ko je bila komšinica Agnes u WandaVision?', ['Agatha Harkness', 'Monica Rambeau', 'Darcy', 'Hayward'], 0],
    ['Ko je Sylvie u Lokiju?', ['Lokijeva varijanta', 'Lokijeva sestra', 'TVA agentkinja', 'Miss Minutes'], 0],
    ['Šta Loki postaje na kraju Loki S2?', ['Čuvar Drveta vremena', 'Kralj Asgarda', 'TVA sudija', 'Kang'], 0],
    ['Ko je U.S. Agent?', ['John Walker', 'Sam Wilson', 'Bucky Barnes', 'Isaiah Bradley'], 0],
    ['Ko okuplja Thunderboltse?', ['Valentina Allegra de Fontaine', 'Nick Fury', 'Ross', 'Zemo'], 0],
    ['Ko je Bob u Thunderbolts*?', ['Sentry', 'Ghost', 'Taskmaster', 'U.S. Agent'], 0],
    ['Kako se Thunderbolts* zovu na kraju filma?', ['New Avengers', 'Dark Avengers', 'Young Avengers', 'Secret Avengers'], 0],
    ['Kako se zove robot u The Fantastic Four: First Steps?', ['H.E.R.B.I.E.', 'J.A.R.V.I.S.', 'K.A.R.E.N.', 'Ultron'], 0],
    ['Kako se zove sin Reeda i Sue?', ['Franklin', 'Johnny', 'Ben', 'Valeria'], 0],
    ['Ko je Silver Surfer u First Steps?', ['Shalla-Bal', 'Norrin Radd', 'Frankie Ray', 'Nova'], 0],
    ['Šta Sam Wilson postaje u Brave New World?', ['Captain America', 'Falcon', 'U.S. Agent', 'White Wolf'], 0],
    ['Ko postaje Red Hulk u Brave New World?', ['Thaddeus Ross', 'Samuel Sterns', 'Isaiah Bradley', 'Bruce Banner'], 0],
    ['Koji film izlazi 18. decembra 2026?', ['Avengers: Doomsday', 'Avengers: Secret Wars', 'Spider-Man: Brand New Day', 'Blade'], 0],
    ['Kako se zove Doomova zemlja?', ['Latverija', 'Sokovija', 'Wakanda', 'Madripur'], 0],
    ['Koje je Doomovo puno ime?', ['Victor von Doom', 'Victor Creed', 'Viktor Vanko', 'Vincent Doom'], 0],
    ['Koji Avengers film dolazi posle Doomsdaya?', ['Avengers: Secret Wars', 'Avengers: The Kang Dynasty', 'Avengers: Endgame 2', 'Avengers: Infinity'], 0],
    ['Ko režira Avengers: Doomsday?', ['Braća Russo', 'Joss Whedon', 'James Gunn', 'Taika Waititi'], 0],
    ['Ko je osnivač X-Mena?', ['Charles Xavier', 'Magneto', 'Wolverine', 'Jean Grey'], 0],
    ['Od čega su Wolverineove kandže?', ['Adamantijuma', 'Vibranijuma', 'Čelika', 'Uru metala'], 0],
    ['O kojoj devojčici brine Logan u filmu Logan?', ['Laura (X-23)', 'Rogue', 'Kitty Pryde', 'Jubilee'], 0],
    ['Koje je Magnetovo pravo ime?', ['Erik Lehnsherr', 'Charles Xavier', 'Scott Summers', 'Hank McCoy'], 0],
    ['Koji X-Men kontroliše vreme (oluje)?', ['Storm', 'Rogue', 'Jean Grey', 'Mystique'], 0],
    ['Koji X-Men ispaljuje lasere iz očiju?', ['Cyclops', 'Havok', 'Beast', 'Iceman'], 0],
    ['Ko postaje Feniks?', ['Jean Grey', 'Storm', 'Rogue', 'Mystique'], 0],
    ['Koji mutant se teleportuje uz oblačić dima?', ['Nightcrawler', 'Quicksilver', 'Blink', 'Angel'], 0],
    ['Koji X-Men je plavi, krzneni naučnik?', ['Beast', 'Nightcrawler', 'Mystique', 'Iceman'], 0],
    ['Kako se zove Deadpoolov taksista?', ['Dopinder', 'Weasel', 'Colossus', 'Peter'], 0],
    ['Kako se zove Deadpoolova devojka?', ['Vanessa', 'Domino', 'Negasonic', 'Blind Al'], 0],
    ['Ko je negativka u Deadpool & Wolverine?', ['Cassandra Nova', 'Mystique', 'Lady Deathstrike', 'Agatha'], 0],
    ['Čija je sestra bliznakinja Cassandra Nova?', ['Charles Xavier', 'Magneto', 'Logan', 'Deadpool'], 0],
    ['U kom delu Njujorka živi Daredevil?', ['Hell\'s Kitchen', 'Harlem', 'Bruklin', 'Kvins'], 0],
    ['Ko je Mattov partner advokat?', ['Foggy Nelson', 'Karen Page', 'Ben Urich', 'Frank Castle'], 0],
    ['Ko je negativac u Jessica Jones S1?', ['Kilgrave', 'Kingpin', 'Cottonmouth', 'Madame Gao'], 0],
    ['Kakvu kožu ima Luke Cage?', ['Neprobojnu', 'Metalnu', 'Kamenu', 'Nevidljivu'], 0],
    ['Kako se zove Iron Fist?', ['Danny Rand', 'Luke Cage', 'Matt Murdock', 'Frank Castle'], 0],
    ['Kako se zove Punisher?', ['Frank Castle', 'Billy Russo', 'Matt Murdock', 'Danny Rand'], 0],
    ['Kako se zove zla organizacija u The Defenders?', ['The Hand (Ruka)', 'Hydra', 'A.I.M.', 'Ten Rings'], 0],
    ['Ko je Milesov ujak u Into the Spider-Verse?', ['Aaron (Prowler)', 'Ben', 'Jefferson', 'Peter'], 0],
    ['Ko je Spider-Man 2099 u Across the Spider-Verse?', ['Miguel O\'Hara', 'Peter B. Parker', 'Hobie Brown', 'Ben Reilly'], 0],
    ['Ko je negativac u Venom: Let There Be Carnage?', ['Carnage (Cletus Kasady)', 'Riot', 'Knull', 'Toxin'], 0],
    ['Ko je pravi negativac u Venom: The Last Dance?', ['Knull', 'Carnage', 'Riot', 'Vulture'], 0],
    ['Šta je Morbius?', ['Živi vampir', 'Vukodlak', 'Simbiot', 'Mutant'], 0],
    ['Ko je glavni negativac u The Amazing Spider-Man 2?', ['Electro', 'Lizard', 'Rhino', 'Green Goblin'], 0],
    ['Ko je negativac u Spider-Man 2 (2004)?', ['Doctor Octopus', 'Green Goblin', 'Sandman', 'Venom'], 0],
    ['Ko je negativac u Spider-Man (2002)?', ['Green Goblin', 'Doctor Octopus', 'Vulture', 'Venom'], 0],
    ['Ko kaže: "Sa velikom moći dolazi velika odgovornost"?', ['Ujak Ben', 'Tetka May', 'Tony Stark', 'Peter'], 0],
    ['Šta Avengersi jedu u sceni posle špice The Avengers?', ['Šavarmu', 'Picu', 'Hamburgere', 'Hot-dog'], 0],
    ['Kako Thor zove Rocketa?', ['Zec', 'Rakun', 'Pas', 'Mače'], 0],
    ['Ko kaže: "I can do this all day"?', ['Captain America', 'Iron Man', 'Thor', 'Hulk'], 0],
    ['Ko kaže: "That\'s my secret, I\'m always angry"?', ['Bruce Banner', 'Thor', 'Natasha', 'Tony Stark'], 0],
    ['Ko je "Ludi Titan"?', ['Thanos', 'Galactus', 'Ego', 'Kang'], 0],
    ['Sa koje planete je Thanos?', ['Titan', 'Xandar', 'Sakaar', 'Vormir'], 0],
    ['Koliko kamenja Thanos ima na samom početku Infinity War?', ['1', '0', '2', '3'], 0],
    ['Koji kamen je u Teseraktu?', ['Kamen prostora', 'Kamen uma', 'Kamen moći', 'Kamen duše'], 0],
    ['Koji kamen je Eter?', ['Kamen stvarnosti', 'Kamen vremena', 'Kamen moći', 'Kamen uma'], 0],
    ['Koji kamen je u Orbu (Guardians)?', ['Kamen moći', 'Kamen prostora', 'Kamen duše', 'Kamen stvarnosti'], 0],
    ['Gde se krije Kamen vremena?', ['U Agamotovom oku', 'U Lokijevom žezlu', 'U Teseraktu', 'Na Vormiru'], 0],
    ['Ko čuva Kamen duše na Vormiru?', ['Red Skull', 'Heimdall', 'Collector', 'Ancient One'], 0],
    ['Šta Captain America iznenada podigne u Endgameu?', ['Mjolnir', 'Stormbreaker', 'Gauntlet', 'Teserakt'], 0],
    ['Ko postaje kralj(ica) Novog Asgarda?', ['Valkyrie', 'Thor', 'Korg', 'Sif'], 0],
    ['Od čega je Korg napravljen?', ['Od kamena', 'Od metala', 'Od drveta', 'Od leda'], 0],
    ['Ko je brat Grandmastera?', ['Collector', 'Ego', 'Thanos', 'Odin'], 0],
    ['Ko je negativac u Thor: Love and Thunder?', ['Gorr', 'Hela', 'Malekith', 'Zeus'], 0],
    ['Ko postaje Mighty Thor u Love and Thunder?', ['Jane Foster', 'Valkyrie', 'Sif', 'Darcy'], 0],
    ['Ko je negativac u Thor: The Dark World?', ['Malekith', 'Hela', 'Surtur', 'Laufey'], 0],
    ['Ko je negativac u Thor: Ragnarok?', ['Hela', 'Malekith', 'Grandmaster', 'Surtur'], 0],
    ['Kako se zove planeta smeća u Thor: Ragnarok?', ['Sakaar', 'Xandar', 'Knowhere', 'Titan'], 0],
    ['Kako Hulk dospeva na Sakaar?', ['Kvindžetom kroz crvotočinu', 'Bifrostom', 'Kroz portal', 'Nije bio tamo'], 0],
    ['Koliko je trajao Blip (nestanak polovine života)?', ['5 godina', '1 godinu', '10 godina', '2 godine'], 0],
    ['Kako se zove Hydrin naučnik iz First Avenger koji završi u kompjuteru?', ['Arnim Zola', 'Red Skull', 'Baron Strucker', 'Ulysses Klaue'], 0],
    ['Ko je napravio Iron Man odelo za Petera (Iron Spider)?', ['Tony Stark', 'Shuri', 'Hank Pym', 'Peter sam'], 0],
    ['Kako se zove Peterov najbolji prijatelj u MCU?', ['Ned Leeds', 'Harry Osborn', 'Flash', 'Miles'], 0],
    ['Ko je Peterov šef/mentor posle Tonyja (Happy)?', ['Happy Hogan', 'Nick Fury', 'Rhodey', 'Ned'], 0],
    ['Ko je Pepperin oklop u Endgameu?', ['Rescue', 'War Machine', 'Iron Heart', 'Iron Monger'], 0],
    ['Ko je Ironheart?', ['Riri Williams', 'Shuri', 'Harley Keener', 'Morgan Stark'], 0],
    ['Ko je Phil Coulson?', ['S.H.I.E.L.D. agent', 'Avenger', 'Hydra vođa', 'Asgardijanac'], 0],
    ['Ko je osnovao S.H.I.E.L.D. (između ostalih)?', ['Peggy Carter i Howard Stark', 'Nick Fury', 'Tony Stark', 'Steve Rogers'], 0],
    ['Kako se zove Hydrin pozdrav?', ['Hail Hydra', 'Glory to Hydra', 'Hydra forever', 'Cut off one head'], 0],
    ['Ko je otac Tonyja Starka?', ['Howard Stark', 'Obadiah Stane', 'Edwin Jarvis', 'Hank Pym'], 0],
    ['Koliko Infinity kamenja postoji?', ['Šest', 'Pet', 'Sedam', 'Osam'], 0]
  ];
  var STONES = ['space', 'mind', 'reality', 'power', 'time', 'soul'];

  var box = null, onWin = null, timers = [], L = 0;
  var only = '';         // vezba: '' = klasika (tri zaredom), inace id jedne igre

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearAll() { timers.forEach(function (t) { if (typeof t === 'object') t.valueOf(); else clearTimeout(t); }); timers = []; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function head(step, title, sub) {
    return '<div class="gm-h"><span class="gm-step">NIVO ' + (L + 1) + (only ? '' : ' · IGRA ' + step + ' / 3') + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }

  /** Mali "+1" na mestu dodira. */
  function plus(host, e, txt, cls) {
    var r = host.getBoundingClientRect(), el = document.createElement('i');
    el.className = 'gm-plus ' + (cls || ''); el.textContent = txt;
    el.style.left = (e.clientX - r.left) + 'px'; el.style.top = (e.clientY - r.top) + 'px';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 700);
  }

  /* ---------------- 1. Uhvati Dooma ---------------- */
  // Mamci (Ultron, Loki) oduzimaju 2, promasaj 1. Glava je sve manja i brza.
  function game1() {
    if (endless && only) return doomEndless();
    clearAll();
    var need = Math.min(32, 12 + 2 * L), left = 15, delay = Math.max(380, 760 - 30 * L), minDelay = Math.max(290, 460 - 15 * L);
    var size = Math.max(36, 58 - 2 * L), bait = Math.round(size * .62), decoys = Math.min(3, 1 + Math.floor(L / 2)), hits = 0, done = false;
    box.innerHTML = head(1, 'Uhvati Dooma', 'Tapni Dooma ' + need + ' puta za 15 s. Mamci −2. Sve je brži.') +
      '<div class="gm-bar"><b id="g1h">0 / ' + need + '</b><b id="g1t">15 s</b></div><div class="gm-arena" id="g1a">' +
      '<button type="button" class="gm-doom" id="g1d" style="width:' + size + 'px;height:' + size + 'px"><img src="img/map/doomhead.jpg" alt="" draggable="false"></button>' +
      Array.apply(null, Array(decoys)).map(function (x, i) { return '<span class="gm-decoy" data-i="' + i + '" style="width:' + bait + 'px;height:' + bait + 'px;font-size:' + Math.round(bait * .5) + 'px">' + ['🤖', '🐍', '👾'][i] + '</span>'; }).join('') + '</div>';
    var arena = box.querySelector('#g1a'), d = box.querySelector('#g1d'), dec = box.querySelectorAll('.gm-decoy');
    function place(el, w, avoid) {
      // mamac nikad ne stane preko Dooma (inace Doom ne moze da se tapne)
      var x, y, n = 0;
      do {
        x = Math.round(Math.random() * (arena.clientWidth - w));
        y = Math.round(Math.random() * (arena.clientHeight - w));
      } while (avoid && n++ < 30 && Math.abs(x - avoid[0]) < size + 12 && Math.abs(y - avoid[1]) < size + 12);
      el.style.left = x + 'px'; el.style.top = y + 'px';
      return [x, y];
    }
    function show() { box.querySelector('#g1h').textContent = Math.max(0, hits) + ' / ' + need; }
    function move() { var at = place(d, size); Array.prototype.forEach.call(dec, function (el) { place(el, bait, at); }); }
    function loop() { if (done) return; move(); later(loop, delay); }
    arena.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (e.target.closest('#g1d')) {
        hits++; UI.buzz(8);
        plus(arena, e, '+1', 'ok');
        delay = Math.max(minDelay, delay - 30);
        d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
        move();
      } else if (e.target.closest('.gm-decoy')) { plus(arena, e, '−2', 'bad'); hits = Math.max(0, hits - 2); UI.buzz([30, 30, 30]); arena.classList.remove('bad'); void arena.offsetWidth; arena.classList.add('bad'); }
      else return;
      show();
      if (hits >= need) { done = true; clearAll(); later(only ? win : game2, 500); }
    });
    loop();
    (function tick() {
      if (done) return;
      box.querySelector('#g1t').textContent = left + ' s';
      if (left-- <= 0) { done = true; fail('Doom je bio brži.'); return; }
      later(tick, 1000);
    })();
  }

  /* ---------------- 2. Kamenje (Simon) ---------------- */
  function game2() {
    if (endless && only) return stonesEndless();
    clearAll();
    var seq = [], len = Math.min(17, 7 + L), pos = 0, input = false;
    var step = Math.max(320, 620 - 20 * L), lit = Math.max(200, 400 - 12 * L);
    // bez istog kamena dvaput zaredom (tesko je, ali posteno)
    for (var i = 0; i < len; i++) { var n; do { n = Math.floor(Math.random() * 6); } while (n === seq[i - 1]); seq.push(n); }
    box.innerHTML = head(2, 'Kamenje beskonačnosti', 'Zapamti ' + len + ' kamenja, pa ponovi. Prikazuje se jednom' + (L >= 2 ? ', a posle se kamenje izmeša.' : '.')) +
      '<div class="gm-bar"><b id="g2s">Gledaj…</b><b id="g2p">0 / ' + len + '</b></div><div class="gm-stones">' +
      STONES.map(function (s, i) { return '<button type="button" class="gm-st" data-i="' + i + '"><img src="img/map/stone-' + s + '.webp" alt="" draggable="false"></button>'; }).join('') + '</div>';
    var btns = box.querySelectorAll('.gm-st');
    function byStone(i) { return box.querySelector('.gm-st[data-i="' + i + '"]'); }
    function flash(i) { var b = byStone(i); b.classList.add('lit'); later(function () { b.classList.remove('lit'); }, lit); }
    seq.forEach(function (n, k) { later(function () { flash(n); }, 700 + k * step); });
    later(function () {
      // od nivoa 2 kamenje promeni mesta pre unosa (pamtis boju, ne poziciju)
      if (L >= 2) { var wrap = box.querySelector('.gm-stones'); shuffle(Array.prototype.slice.call(btns)).forEach(function (b) { wrap.appendChild(b); }); }
      input = true; box.querySelector('#g2s').textContent = 'Tvoj red';
    }, 700 + len * step);
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        if (!input) return;
        var i = +b.getAttribute('data-i');
        flash(i); UI.buzz(6);
        if (i !== seq[pos]) {
          input = false; b.classList.add('wrong');
          var right = byStone(seq[pos]); right.classList.add('should');
          later(function () { fail('Pogrešan kamen — trebalo je ' + ['plavi', 'žuti', 'crveni', 'ljubičasti', 'zeleni', 'narandžasti'][seq[pos]] + '. Stigao si do ' + pos + ' / ' + len + '.'); }, 900);
          return;
        }
        pos++;
        box.querySelector('#g2p').textContent = pos + ' / ' + len;
        if (pos === len) { input = false; later(only ? win : game3, 600); }
      });
    });
  }

  /* ---------------- beskonacno: prave verzije ----------------
     Kamenje: klasican "Simon" - niz raste za jedan kamen svaki krug.
     Kviz: pitanje za pitanjem do prve greske (vreme se skracuje).
     Doom: prezivljavanje - svaki pogodak dodaje vreme, mamci ga oduzimaju. */
  var COLORS = ['plavi', 'žuti', 'crveni', 'ljubičasti', 'zeleni', 'narandžasti'];
  function snd(n) { if (MM.Sfx) MM.Sfx.play(n); }

  function stonesEndless() {
    clearAll();
    var seq = [], pos = 0, input = false;
    box.innerHTML = '<div class="gm-h"><span class="gm-step">BESKONAČNO · NIZ RASTE</span><h2>Kamenje beskonačnosti</h2><p class="muted">Zapamti niz i ponovi ga. Svaki krug dodaje još jedan kamen na kraj.</p></div>' +
      '<div class="gm-bar"><b id="g2s">Gledaj…</b><b id="g2p">Niz: 1</b></div><div class="gm-stones simon">' +
      STONES.map(function (st, i) { return '<button type="button" class="gm-st" data-i="' + i + '"><img src="img/map/stone-' + st + '.webp" alt="" draggable="false"></button>'; }).join('') + '</div>' +
      '<div class="gm-seq" id="g2q"></div>';
    function byStone(i) { return box.querySelector('.gm-st[data-i="' + i + '"]'); }
    function flash(i, ms) { var b = byStone(i); if (!b) return; b.classList.remove('lit'); void b.offsetWidth; b.classList.add('lit'); later(function () { b.classList.remove('lit'); }, ms); }
    function dots() {
      var q = box.querySelector('#g2q'); if (!q) return;
      q.innerHTML = seq.map(function (n, k) { return '<i class="' + (k < pos ? 'ok' : '') + '"></i>'; }).join('');
    }
    function round() {
      seq.push(Math.floor(Math.random() * 6));
      pos = 0; input = false;
      var step = Math.max(330, 640 - seq.length * 16), lit = Math.round(step * .62);
      box.querySelector('#g2s').textContent = 'Gledaj…';
      box.querySelector('#g2p').textContent = 'Niz: ' + seq.length;
      box.querySelector('.gm-stones').classList.add('watch');
      dots();
      seq.forEach(function (n, k) { later(function () { flash(n, lit); snd('tick'); }, 650 + k * step); });
      later(function () {
        input = true; box.querySelector('#g2s').textContent = 'Tvoj red';
        box.querySelector('.gm-stones').classList.remove('watch');
      }, 650 + seq.length * step);
    }
    Array.prototype.forEach.call(box.querySelectorAll('.gm-st'), function (b) {
      b.addEventListener('click', function () {
        if (!input) return;
        var i = +b.getAttribute('data-i');
        flash(i, 220); UI.buzz(6);
        if (i !== seq[pos]) {
          input = false; b.classList.add('wrong'); byStone(seq[pos]).classList.add('should');
          streak = seq.length - 1;
          later(function () { fail('Pogrešan kamen — trebalo je ' + COLORS[seq[pos]] + '. Najduži niz: ' + streak + '.'); }, 900);
          return;
        }
        pos++; dots(); snd('tap');
        if (pos === seq.length) {
          input = false; streak = seq.length; snd('ok');
          box.querySelector('#g2s').textContent = '✓ Bravo';
          later(round, 750);
        }
      });
    });
    round();
  }

  function quizEndless() {
    clearAll();
    // obicna pitanja + pitanja iz filmova koje si vec gledao (bez spojlera)
    var pool = QUIZ.slice(), st = MM.Store.get();
    if (MM.QUIZ) Object.keys(MM.QUIZ).forEach(function (id) {
      var it = MM.Cat.get(id); if (!it || !MM.Plan.isDone(it, st)) return;
      MM.QUIZ[id].forEach(function (r) { pool.push([r[0] + ' (' + MM.Cat.cleanTitle(it) + ')', r.slice(1), 0]); });
    });
    pool = shuffle(pool);
    var k = 0, answered = false;
    function ask() {
      answered = false;
      var q = pool[k % pool.length], secs = Math.max(5, 13 - Math.floor(streak / 4));
      var opts = shuffle(q[1].map(function (t, i) { return { t: t, ok: i === q[2] }; }));
      box.innerHTML = '<div class="gm-h"><span class="gm-step">BESKONAČNO · DO PRVE GREŠKE</span><h2>Marvel kviz</h2><p class="muted">Svako tačno je +1. Što dalje ideš, manje vremena.</p></div>' +
        '<div class="gm-bar"><b>Tačnih: ' + streak + '</b><b id="g3t">' + secs + ' s</b></div><div class="gm-tbar"><i id="g3b"></i></div><p class="gm-q">' + esc(q[0]) + '</p><div class="gm-opts">' +
        opts.map(function (o) { return '<button type="button" class="btn ghost wide gm-o" data-ok="' + (o.ok ? 1 : 0) + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
      var bar = box.querySelector('#g3b'); bar.style.transition = 'none'; bar.style.width = '100%';
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (bar) { bar.style.transition = 'width ' + secs + 's linear'; bar.style.width = '0%'; } }); });
      Array.prototype.forEach.call(box.querySelectorAll('.gm-o'), function (b) {
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          if (b.getAttribute('data-ok') !== '1') {
            b.classList.add('bad'); UI.buzz([20, 40, 20]); snd('bad');
            var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good');
            later(function () { fail('Netačno — tačno je „' + q[1][q[2]] + '“.'); }, 1200);
            return;
          }
          b.classList.add('good'); UI.buzz(8); snd('ok');
          streak++; k++;
          later(ask, 500);
        });
      });
      var t = secs, myK = k;
      (function tick() {
        if (answered || k !== myK || !box) return;
        var el = box.querySelector('#g3t'); if (el) el.textContent = t + ' s';
        if (t <= 3 && t > 0) snd('tick');
        if (t-- <= 0) { answered = true; var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good'); later(function () { fail('Isteklo vreme — tačno je „' + q[1][q[2]] + '“.'); }, 1000); return; }
        later(tick, 1000);
      })();
    }
    ask();
  }

  function doomEndless() {
    clearAll();
    var left = 10, hits = 0, done = false, delay = 820, size = 58, last = Date.now();
    box.innerHTML = '<div class="gm-h"><span class="gm-step">BESKONAČNO · PREŽIVI</span><h2>Uhvati Dooma</h2><p class="muted">Svaki pogodak dodaje vreme. Mamci ga oduzimaju. Doom je sve brži i manji.</p></div>' +
      '<div class="gm-bar"><b id="g1h">0 pogodaka</b><b id="g1t">10,0 s</b></div><div class="gm-tbar"><i id="g1b" style="width:66%"></i></div><div class="gm-arena" id="g1a">' +
      '<button type="button" class="gm-doom" id="g1d" style="width:58px;height:58px"><img src="img/map/doomhead.jpg" alt="" draggable="false"></button>' +
      [0, 1, 2].map(function (i) { return '<span class="gm-decoy" data-i="' + i + '" style="width:36px;height:36px;font-size:18px;' + (i ? 'display:none' : '') + '">' + ['🤖', '🐍', '👾'][i] + '</span>'; }).join('') + '</div>';
    var arena = box.querySelector('#g1a'), d = box.querySelector('#g1d'), dec = box.querySelectorAll('.gm-decoy');
    function place(el, w, avoid) {
      var x, y, n = 0;
      do { x = Math.round(Math.random() * (arena.clientWidth - w)); y = Math.round(Math.random() * (arena.clientHeight - w)); }
      while (avoid && n++ < 30 && Math.abs(x - avoid[0]) < size + 12 && Math.abs(y - avoid[1]) < size + 12);
      el.style.left = x + 'px'; el.style.top = y + 'px'; return [x, y];
    }
    function move() {
      var at = place(d, size), nd = Math.min(3, 1 + Math.floor(hits / 12));
      Array.prototype.forEach.call(dec, function (el, i) { el.style.display = i < nd ? '' : 'none'; if (i < nd) place(el, 36, at); });
    }
    function loop() { if (done) return; move(); later(loop, delay); }
    function show() {
      box.querySelector('#g1h').textContent = hits + ' ' + (hits === 1 ? 'pogodak' : 'pogodaka');
      var t = box.querySelector('#g1t'); t.textContent = left.toFixed(1).replace('.', ',') + ' s'; t.classList.toggle('hot', left < 3);
      box.querySelector('#g1b').style.width = Math.min(100, left / 15 * 100) + '%';
    }
    arena.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (done) return;
      if (e.target.closest('#g1d')) {
        hits++; UI.buzz(8); snd('coin');
        var add = Math.max(.35, .95 - hits * .012);
        left = Math.min(15, left + add);
        plus(arena, e, '+' + add.toFixed(1).replace('.', ',') + ' s', 'ok');
        delay = Math.max(300, delay - 14);
        if (hits % 6 === 0 && size > 34) { size -= 3; d.style.width = d.style.height = size + 'px'; }
        d.classList.remove('hit'); void d.offsetWidth; d.classList.add('hit');
        move();
      } else if (e.target.closest('.gm-decoy')) {
        left = Math.max(0, left - 2); plus(arena, e, '−2 s', 'bad'); UI.buzz([30, 30, 30]); snd('bad');
        arena.classList.remove('bad'); void arena.offsetWidth; arena.classList.add('bad');
      } else return;
      show();
    });
    loop();
    (function tick() {
      if (done) return;
      var now = Date.now(); left = Math.max(0, left - (now - last) / 1000); last = now;
      show();
      if (left <= 0) { done = true; streak = hits; fail('Isteklo vreme — Doom je pobegao.'); return; }
      later(tick, 100);
    })();
  }


  /* ---------------- 3. Kviz ---------------- */
  function game3() {
    if (endless && only) return quizEndless();
    clearAll();
    var total = Math.min(15, 6 + L), secs = Math.max(5, 12 - Math.floor(L / 2)), qs = shuffle(QUIZ).slice(0, total), k = 0, answered = false;
    function ask() {
      answered = false;
      var q = qs[k];
      var opts = q[1].map(function (t, i) { return { t: t, ok: i === q[2] }; });
      opts = shuffle(opts);
      box.innerHTML = head(3, 'Marvel kviz', total + ' pitanja, ' + secs + ' sekundi po pitanju. Sva tačna.') +
        '<div class="gm-bar"><b>Pitanje ' + (k + 1) + ' / ' + total + '</b><b id="g3t">' + secs + ' s</b></div><p class="gm-q">' + esc(q[0]) + '</p><div class="gm-opts">' +
        opts.map(function (o, i) { return '<button type="button" class="btn ghost wide gm-o" data-ok="' + (o.ok ? 1 : 0) + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
      Array.prototype.forEach.call(box.querySelectorAll('.gm-o'), function (b) {
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          if (b.getAttribute('data-ok') !== '1') {
            b.classList.add('bad'); UI.buzz([20, 40, 20]); if (MM.Sfx) MM.Sfx.play('bad');
            var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good');
            later(function () { fail('Netačno — tačno je „' + q[1][q[2]] + '“.'); }, 1100);
            return;
          }
          b.classList.add('good'); UI.buzz(8); if (MM.Sfx) MM.Sfx.play('ok');
          k++;
          later(k === total ? win : ask, 450);
        });
      });
      var t = secs, myK = k;
      (function tick() {
        if (answered || k !== myK || !box) return;
        var el = box.querySelector('#g3t'); if (el) el.textContent = t + ' s';
        if (t-- <= 0) { answered = true; var g = box.querySelector('.gm-o[data-ok="1"]'); if (g) g.classList.add('good'); later(function () { fail('Isteklo vreme — tačno je „' + q[1][q[2]] + '“.'); }, 900); return; }
        later(tick, 1000);
      })();
    }
    ask();
  }


  /* ============================================================
     dodatne igre (samo u tabu Igre)
     ============================================================ */

  function solo(title, sub) {
    return '<div class="gm-h"><span class="gm-step">NIVO ' + (L + 1) + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(sub) + '</p></div>';
  }
  function countdown(sec, elId, onEnd, isDone) {
    var left = sec;
    (function tick() {
      if (isDone()) return;
      var el = box && box.querySelector(elId); if (el) el.textContent = left + ' s';
      if (left-- <= 0) { onEnd(); return; }
      later(tick, 1000);
    })();
  }

  /* --- Memorija: parovi predmeta iz filmova --- */
  function gMemo() {
    clearAll();
    var pairs = Math.min(10, 6 + Math.floor(L / 2)), secs = Math.max(22, 60 - 2.5 * L), done = false;
    var pool = shuffle(MM.Cat.all().filter(function (i) { return MM.Badges.ITEMS[i.id] && MM.Badges.spec(i).icon !== 'gauntlet'; }));
    var icons = {}, picks = [];
    pool.forEach(function (i) { var ic = MM.Badges.spec(i).icon; if (!icons[ic] && picks.length < pairs) { icons[ic] = 1; picks.push(i); } });
    var cards = shuffle(picks.concat(picks).map(function (it, k) { return { id: it.id, k: k }; }));
    box.innerHTML = solo('Memorija', 'Nađi ' + pairs + ' parova predmeta za ' + secs + ' sekundi.') +
      '<div class="gm-bar"><b id="mmP">0 / ' + pairs + '</b><b id="mmT">' + secs + ' s</b></div>' +
      '<div class="gm-memo c' + (pairs > 8 ? 5 : 4) + '">' + cards.map(function (c, n) {
        return '<button type="button" class="mm-c" data-n="' + n + '" data-id="' + esc(c.id) + '"><span class="mm-back">?</span><span class="mm-front">' + MM.Badges.tile(MM.Cat.get(c.id), { size: 'sm' }) + '</span></button>';
      }).join('') + '</div>';
    var open1 = null, lock = false, found = 0;
    Array.prototype.forEach.call(box.querySelectorAll('.mm-c'), function (b) {
      b.addEventListener('click', function () {
        if (lock || done || b.classList.contains('up') || b.classList.contains('ok')) return;
        b.classList.add('up'); UI.buzz(5);
        if (!open1) { open1 = b; return; }
        if (open1.getAttribute('data-id') === b.getAttribute('data-id')) {
          open1.classList.add('ok'); b.classList.add('ok'); open1 = null; found++;
          box.querySelector('#mmP').textContent = found + ' / ' + pairs;
          if (found === pairs) { done = true; clearAll(); later(win, 500); }
        } else {
          lock = true; var a = open1; open1 = null;
          later(function () { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 650);
        }
      });
    });
    countdown(secs, '#mmT', function () { done = true; fail('Isteklo vreme. Pamćenje kao Drax.'); }, function () { return done; });
  }

  /* --- Hronologija: poredaj filmove po izlasku --- */
  function gHrono() {
    clearAll();
    var n = Math.min(10, 4 + Math.floor(L / 2)), secs = Math.max(16, 40 - 1.5 * L), done = false;
    var films = MM.Cat.all().filter(function (i) { return i.type === 'film' && (i.col === 'mcu' || L >= 3) && i.date <= '2026-08-01'; });
    var pick = [], years = {};
    shuffle(films).forEach(function (f) { if (pick.length < n && !years[f.date]) { years[f.date] = 1; pick.push(f); } });
    var right = pick.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    box.innerHTML = solo('Hronologija', 'Tapni ' + n + ' filmova redom kako su izlazili — od najstarijeg.') +
      '<div class="gm-bar"><b id="hrP">0 / ' + n + '</b><b id="hrT">' + secs + ' s</b></div><div class="gm-hrono">' +
      shuffle(pick).map(function (f) { return '<button type="button" class="hr-b" data-id="' + esc(f.id) + '"><i></i>' + esc(MM.Cat.cleanTitle(f)) + '</button>'; }).join('') + '</div>';
    var pos = 0;
    Array.prototype.forEach.call(box.querySelectorAll('.hr-b'), function (b) {
      b.addEventListener('click', function () {
        if (done || b.classList.contains('ok')) return;
        if (b.getAttribute('data-id') !== right[pos].id) {
          done = true; b.classList.add('bad'); UI.buzz([20, 40, 20]);
          later(function () { fail('Pre njega je bio „' + MM.Cat.cleanTitle(right[pos]) + '“ (' + right[pos].year + ').'); }, 600);
          return;
        }
        pos++; b.classList.add('ok'); b.querySelector('i').textContent = pos + ' · ' + right[pos - 1].year; UI.buzz(8);
        box.querySelector('#hrP').textContent = pos + ' / ' + n;
        if (pos === n) { done = true; clearAll(); later(win, 600); }
      });
    });
    countdown(secs, '#hrT', function () { done = true; fail('Isteklo vreme.'); }, function () { return done; });
  }

  /** Igre: id -> { naziv, ikonica, kratak opis, uputstvo, boja, funkcija } */
  var REG = {
    quiz: { name: 'Marvel kviz', emo: '❓', desc: 'znanje, na vreme', col: '#3b82f6', how: '250+ pitanja o celom MCU-u. Što viši nivo, više pitanja i manje vremena.', fn: function () { return game3(); } },
    doom: { name: 'Uhvati Dooma', emo: '🎯', desc: 'brzina i preciznost', col: '#22c55e', how: 'Tapni Dooma pre nego što pobegne. Mamci oduzimaju poene, a on je sve brži.', fn: function () { return game1(); } },
    stones: { name: 'Kamenje', emo: '💎', desc: 'pamćenje niza', col: '#a855f7', how: 'Kamenje beskonačnosti zasvetli redom — ponovi niz. Svaki nivo je duži.', fn: function () { return game2(); } },
    memo: { name: 'Memorija', emo: '🃏', desc: 'parovi predmeta', col: '#f59e0b', how: 'Okreći karte i nađi parove predmeta iz filmova pre isteka vremena.', fn: gMemo },
    hrono: { name: 'Hronologija', emo: '📅', desc: 'filmovi po izlasku', col: '#e62429', how: 'Poređaj filmove po datumu izlaska. Jedna greška i počinješ ispočetka.', fn: gHrono }
  };

  /** 3 - 2 - 1 pa igra, da te ne iznenadi. */
  function intro(fn) {
    clearAll();
    var n = endless && streak > 0 ? 1 : 3;
    (function tick() {
      if (!box) return;
      if (n === 0) { fn(); return; }
      box.innerHTML = '<div class="gm-cnt"><b>' + (endless && streak > 0 ? 'NIVO ' + (L + 1) : n) + '</b><span>' + esc((only ? REG[only].name : 'Klasika: tri zaredom') + (endless ? ' · beskonačno' : '')) + '</span></div>';
      UI.buzz(6); n--;
      later(tick, 650);
    })();
  }

  function first() { intro(only ? REG[only].fn : game1); }

  function fail(why) {
    clearAll(); if (MM.Sfx) MM.Sfx.play('lose');
    if (endless) {
      var res = menuInfo.onEndless ? menuInfo.onEndless(streak) : null;
      box.innerHTML = '<div class="gm-end"><div class="gm-emo">♾️</div><h2>' + streak + ' ' + unit(streak) + '</h2><p class="muted">' + esc(why) + '</p>' +
        (res && res.rec ? '<p><b class="gm-up">Novi rekord u beskonačnom!</b></p>' : '') + (res && res.xp ? '<p><b class="gm-xp">+' + res.xp + ' XP</b></p>' : '') +
        '<button type="button" class="btn primary wide" id="gmRe">Ponovo</button><button type="button" class="btn ghost wide" id="gmMenu">Meni igre</button></div>';
      box.querySelector('#gmRe').onclick = startEndless;
      box.querySelector('#gmMenu').onclick = menuView;
      if (res && res.up) setTimeout(function () { levelUp(res.lvl, res.title); }, 700);
      return;
    }
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">😵</div><h2>Pao si.</h2><p class="muted">' + esc(why) +
      (only ? '' : ' Kreće se od prve igre.') + '</p>' +
      '<button type="button" class="btn primary wide" id="gmRe">Ponovo</button><button type="button" class="btn ghost wide" id="gmMenu">Meni igre</button></div>';
    box.querySelector('#gmRe').onclick = first;
    box.querySelector('#gmMenu').onclick = menuView;
  }

  /** Sta se broji u beskonacnom (po igri). */
  function unit(n) {
    var one = n % 10 === 1 && n % 100 !== 11, few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20);
    if (only === 'stones') return one ? 'kamen u nizu' : few ? 'kamena u nizu' : 'kamenova u nizu';
    if (only === 'quiz') return one ? 'tačan' : few ? 'tačna' : 'tačnih';
    if (only === 'doom') return one ? 'pogodak' : few ? 'pogotka' : 'pogodaka';
    return one ? 'nivo' : 'nivoa';
  }

  function confetti() {
    var fx = document.createElement('div'); fx.className = 'gm-conf';
    var c = ['#ffd36b', '#e62429', '#39d97a', '#3b82f6', '#a855f7', '#ff8a00'], h = '';
    for (var i = 0; i < 40; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + c[i % 6] + ';animation-delay:' + (Math.random() * .4).toFixed(2) + 's;--x:' + (Math.random() * 120 - 60).toFixed(0) + 'px;--r:' + (Math.random() * 720).toFixed(0) + 'deg"></i>';
    fx.innerHTML = h; document.body.appendChild(fx);
    setTimeout(function () { fx.remove(); }, 2400);
  }

  function win() {
    clearAll(); if (MM.Sfx) MM.Sfx.play(endless ? 'ok' : 'win');
    if (endless) {
      // beskonacno: odmah sledeci nivo, sve teze
      streak++; UI.buzz([10, 30]);
      box.innerHTML = '<div class="gm-cnt"><b>✓</b><span>' + streak + ' ' + (streak === 1 ? 'nivo' : 'nivoa') + ' zaredom</span></div>';
      L++; later(first, 700);
      return;
    }
    confetti(); UI.buzz([15, 40, 25]);
    var r = onWin ? onWin(L + 1) : null;
    box.innerHTML = '<div class="gm-end"><div class="gm-emo">🏆</div><h2>Prešao si nivo ' + (L + 1) + '!</h2>' +
      '<p class="muted">' + (r && r.xp ? '<b class="gm-xp">+' + r.xp + ' XP</b>' +
        (r.rec ? '<br>Novi rekord u ovoj igri!' : '') : (only ? 'Probaj teži nivo.' : 'Sve tri igre zaredom. Ozbiljno.')) + '</p>' +
      (L < MAXLV - 1 ? '<button type="button" class="btn primary wide" id="gmNext">Nivo ' + (L + 2) + '</button>' : '<p class="muted">To je bio poslednji nivo. Probaj beskonačni mod.</p>') +
      '<button type="button" class="btn ghost wide" id="gmMenu">Meni igre</button></div>';
    var nx = box.querySelector('#gmNext');
    if (nx) nx.onclick = function () { L = Math.min(MAXLV - 1, L + 1); first(); };
    box.querySelector('#gmMenu').onclick = menuView;
    if (r && r.up) setTimeout(function () { levelUp(r.lvl, r.title); }, 700);
  }

  /* ---------------- meni igre ----------------
     Svaka igra ima svoj ekran: opis, staza od 10 nivoa (predjeni,
     sledeci, zakljucani), rekord ekipe i veliko dugme Igraj. */
  var menuInfo = null;   // { id, best(), team, endlessBest(), onEndless(n) }
  var MAXLV = 20, endless = false, streak = 0;
  function startEndless() { endless = true; streak = 0; L = 0; UI.buzz(8); first(); }
  function menuView() {
    clearAll();
    endless = false;
    var id = only, r = only ? REG[only] : { name: 'Klasika', emo: '🏆', col: '#ffb400', how: 'Uhvati Dooma, Kamenje i Kviz zaredom, bez pada. Vredi trostruko XP.' };
    var best = menuInfo.best(), next = Math.min(MAXLV, best + 1), team = menuInfo.team || null, eb = menuInfo.endlessBest ? menuInfo.endlessBest() : 0;
    box.innerHTML = '<div class="gmm" style="--gc:' + r.col + '">' +
      '<div class="gmm-hero"><span class="gmm-emo">' + r.emo + '</span><h2>' + esc(r.name) + '</h2><p>' + esc(r.how) + '</p></div>' +
      '<div class="gmm-path">' + Array.apply(null, Array(MAXLV)).map(function (x, i) {
        var n = i + 1, st = n <= best ? 'done' : n === next ? 'next' : 'lock';
        return '<button type="button" class="gmm-n ' + st + '" data-l="' + n + '"' + (st === 'lock' ? ' disabled' : '') + '><b>' + n + '</b>' + (st === 'done' ? '<i>★</i>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="gmm-stats"><div><b>' + best + '/' + MAXLV + '</b><i>tvoj rekord</i></div><div><b>+' + xpFor(id || 'classic', next) + ' XP</b><i>za nivo ' + next + '</i></div>' +
        '<div><b>' + (team ? esc(team.n) : '—') + '</b><i>' + (team ? 'najbolji u ekipi · ' + team.v : 'rekord ekipe') + '</i></div></div>' +
      '<button type="button" class="gmm-play" id="gmmGo"><b>IGRAJ</b><span>nivo ' + next + '</span></button>' +
      '<button type="button" class="gmm-endless" id="gmmInf"><b>♾️ Beskonačno</b><span>' + ({ stones: 'niz raste za jedan kamen', quiz: 'pitanja do prve greške', doom: 'preživi što duže' }[id] || 'nivoi idu dok ne pogrešiš') + ' · rekord ' + eb + '</span></button></div>';
    box.querySelector('#gmmGo').onclick = function () { L = next - 1; UI.buzz(8); first(); };
    box.querySelector('#gmmInf').onclick = startEndless;
    Array.prototype.forEach.call(box.querySelectorAll('.gmm-n:not([disabled])'), function (b) {
      b.onclick = function () { L = +b.getAttribute('data-l') - 1; UI.buzz(8); first(); };
    });
  }

  /** Otvori meni igre. id: kljuc iz REG ili '' za klasiku. opts: { best(), team: {n, v} } */
  function open(level, cb, opts) {
    L = level || 0;
    onWin = cb;
    opts = opts || {};
    only = opts.only || '';
    menuInfo = { best: opts.best || function () { return L; }, team: opts.team, endlessBest: opts.endlessBest, onEndless: opts.onEndless };
    endless = false;
    UI.openSheet({
      id: 'games', full: true, cls: 'gm-sheet',
      render: function () {
        return '<div class="gm-top"><button type="button" class="ib close" data-a="sheet-close" aria-label="Zatvori">✕</button></div>' +
          '<div class="gm no-drag" id="gmBox" data-keep></div>';
      },
      onOpen: function (el) {
        box = el.querySelector('#gmBox'); if (MM.Sfx) MM.Sfx.music('menu');
        if (opts.direct) first(); else menuView();
      },
      onClose: function () { clearAll(); box = null; if (MM.Sfx) MM.Sfx.music(null); }
    });
  }

  /* ---------------- nivo igraca ---------------- */
  var TITLES = ['Rekrut', 'Kadet S.H.I.E.L.D.-a', 'Agent', 'Specijalni agent', 'Defender', 'Guardian', 'Avenger',
    'Revenger', 'Sorcerer Supreme', 'Vrhovni Avenger', 'Asgardijanac', 'Celestial', 'Doomov rival'];
  /** Nivo iz XP: nivo n trazi 50 + 100 + ... + 50*(n-1) XP. */
  function lvlOf(xp) {
    var n = Math.floor((Math.sqrt(1 + 8 * (xp || 0) / 50) - 1) / 2) + 1;
    var from = 50 * (n - 1) * n / 2, to = 50 * n * (n + 1) / 2;
    return { n: n, title: TITLES[Math.min(TITLES.length - 1, n - 1)], from: from, to: to, pct: Math.round(((xp || 0) - from) / (to - from) * 100) };
  }
  /** XP za predjen nivo igre: klasika (tri zaredom) vredi trostruko. */
  function xpFor(id, level) { return (id === 'classic' ? 15 : 5) * level; }

  /** Veliki ekran za novi nivo igraca. */
  function levelUp(n, title) {
    var el = document.createElement('div'); el.className = 'lvlup';
    el.innerHTML = '<div class="lu-rays"></div><div class="lu-box"><em>NOVI NIVO</em><div class="lu-badge"><b>' + n + '</b></div><h2>' + esc(title) + '</h2>' +
      '<p>' + (TITLES[n] && TITLES[n] !== title ? 'Sledeća titula: ' + esc(TITLES[n]) : 'Nastavi da igraš.') + '</p><button type="button" class="btn primary wide">Super!</button></div>';
    document.body.appendChild(el);
    confetti(); UI.buzz([20, 60, 30, 60, 40]); if (MM.Sfx) MM.Sfx.play('levelup');
    var close = function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); };
    el.querySelector('button').onclick = close;
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
  }

  MM.Games = { open: open, REG: REG, lvlOf: lvlOf, xpFor: xpFor, TITLES: TITLES, levelUp: levelUp };
})();
