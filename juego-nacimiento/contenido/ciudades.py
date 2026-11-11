"""Fichas de las ciudades y lugares de los mapas.

Regla de contenido:
  - fuente 'biblia'   -> solo lo que dice el texto; cada punto lleva su cita, y la cita
                         debe estar en VERIFICADAS (cotejadas con la RVR1960 en Bible Gateway).
  - fuente 'historia' -> datos de historia, geografía y arqueología. Son datos humanos,
                         no inspirados: se dicen con prudencia ("se calcula", "los arqueólogos").
Nada alegórico: donde los intérpretes conservadores difieren, se dice y se muestran las lecturas
que salen del texto.
"""
from versiculos import V

# Textos RVR1960 verificados para esta sección (además de los de versiculos.py)
VC = {
    'Jn 1:46': 'Natanael le dijo: ¿De Nazaret puede salir algo de bueno? Le dijo Felipe: Ven y ve.',
    '2 Cr 3:1': 'Comenzó Salomón a edificar la casa de Jehová en Jerusalén, en el monte Moriah, que había sido mostrado a David su padre, en el lugar que David había preparado en la era de Ornán jebuseo.',
    'Jer 31:15': 'Así ha dicho Jehová: Voz fue oída en Ramá, llanto y lloro amargo; Raquel que lamenta por sus hijos, y no quiso ser consolada acerca de sus hijos, porque perecieron.',
    'Os 11:1': 'Cuando Israel era muchacho, yo lo amé, y de Egipto llamé a mi hijo.',
    'Jos 24:2-3': 'Y dijo Josué a todo el pueblo: Así dice Jehová, Dios de Israel: Vuestros padres habitaron antiguamente al otro lado del río, esto es, Taré, padre de Abraham y de Nacor; y servían a dioses extraños. Y yo tomé a vuestro padre Abraham del otro lado del río, y lo traje por toda la tierra de Canaán, y aumenté su descendencia, y le di a Isaac.',
    'Gn 12:6-7': 'Y pasó Abram por aquella tierra hasta el lugar de Siquem, hasta el encino de More; y el cananeo estaba entonces en la tierra. Y apareció Jehová a Abram, y le dijo: A tu descendencia daré esta tierra. Y edificó allí un altar a Jehová, quien le había aparecido.',
    'Jn 1:17': 'Pues la ley por medio de Moisés fue dada, pero la gracia y la verdad vinieron por medio de Jesucristo.',
    'Gn 35:19': 'Así murió Raquel, y fue sepultada en el camino de Efrata, la cual es Belén.',
}

# Citas cotejadas una por una con la RVR1960 (Bible Gateway, 2026-11-11)
VERIFICADAS = set(V) | set(VC) | {
    'Gn 35:16-18', 'Gn 48:7', 'Rt 1:2', 'Rt 1:22', 'Rt 4:11', '1 S 17:12', 'Jos 19:15', '2 S 23:15', 'Esd 2:21',
    'Lc 2:7', 'Lc 2:8', 'Lc 2:24', 'Lv 12:8', 'Lc 2:4', 'Lc 4:16', 'Lc 4:29', 'Mr 6:3', 'Mt 13:55', 'Mt 2:23',
    'Jn 7:41-42', 'Jn 7:52', 'Mt 26:73', 'Mt 4:15', 'Lc 1:26-27', 'Lc 1:36', 'Lc 2:39', 'Lc 2:51-52', 'Jn 19:19',
    'Hch 24:5', 'Mt 2:1', 'Mt 2:16', 'Mt 2:22', 'Gn 14:18', 'Sal 76:2', '2 S 5:6-7', 'Jn 2:20', 'Dt 16:16',
    'Mt 21:12', 'Lc 2:41-42', 'Lc 19:41', 'Hb 13:12', 'Ap 21:2', '2 R 25:9', 'Mt 2:3', 'Jn 5:2', 'Hch 2:5',
    'Jos 18:25', '1 R 15:17', 'Jer 40:1', 'Mt 2:18', '1 S 7:17', 'Mt 2:15', 'Gn 41:57', 'Éx 12:12', 'Hch 7:22',
    'Hch 27:6', 'Gn 47:6', 'Éx 1:11', 'Hch 7:2-4', 'Gn 11:28', 'Gn 11:32', 'Gn 28:10', 'Gn 29:4', 'Gn 31:19',
    'Gn 24:10', 'Gn 33:18-20', 'Jos 24:32', 'Jn 4:5-6', 'Jn 4:9', 'Jn 4:20', 'Dt 11:29', '1 R 12:25', 'Éx 3:1',
    'Nm 10:11-12', '1 R 19:8', 'Gá 4:25', 'Éx 16:35', 'Éx 20:2-3', 'Dt 5:2', 'Éx 19:5',
}


def B(t, *items):  # sección con base bíblica
    return {'t': t, 'fuente': 'biblia', 'items': [{'texto': a, 'cita': c} for a, c in items]}


def H(t, *items):  # sección de historia / arqueología
    return {'t': t, 'fuente': 'historia', 'items': [{'texto': a} for a in items]}


def P(pregunta, ops, r, cita, ex):
    return {'pregunta': pregunta, 'opciones': ops, 'respuesta': r, 'cita': cita, 'explicacion': ex}


CIUDADES = {
'Belén': {
    'titulo': 'Belén Efrata · “casa del pan”',
    'hoy': 'Cisjordania, unos 8 km al sur de Jerusalén, a unos 775 m de altura.',
    'clave': 'Mi 5:2',
    'secciones': [
        B('🏷️ El nombre: ¿por qué “Belén Efrata”?',
          ('Belén (Bet-lejem) significa “casa del pan”. Efrata es el nombre antiguo del lugar: la Biblia los une desde Génesis.', 'Gn 35:19'),
          ('A los de esa familia y lugar se les llamaba “efrateos de Belén de Judá”.', 'Rt 1:2'),
          ('Había otra Belén en el territorio de Zabulón, al norte. Decir “Belén Efrata” o “Belén de Judá” deja claro de cuál se habla.', 'Jos 19:15'),
          ('Miqueas la llama “pequeña para estar entre las familias de Judá”: de un pueblo pequeño saldría el gobernante eterno.', 'Mi 5:2')),
        B('📖 Lo que dice la Biblia',
          ('Allí murió Raquel al dar a luz a Benjamín, en el camino a Efrata.', 'Gn 35:16-18'),
          ('Rut la moabita llegó a Belén al comienzo de la siega de la cebada y allí se casó con Booz.', 'Rt 1:22'),
          ('David era hijo de Isaí, “efrateo de Belén de Judá”.', '1 S 17:12'),
          ('Dios envió a Samuel a Belén, a casa de Isaí, y allí ungió a David como rey.', '1 S 16:1'),
          ('Volvieron del exilio en Babilonia 123 “hijos de Belén”: un pueblo pequeño.', 'Esd 2:21'),
          ('Jesús nació en Belén de Judea, en días del rey Herodes.', 'Mt 2:1')),
        H('🌾 Economía y comercio',
          'Pueblo agrícola: trigo y cebada en los valles al este, olivos y viñas en las laderas.',
          'Pastoreo de ovejas y cabras en las tierras más secas que bajan hacia el desierto de Judea (Lc 2:8 muestra pastores en la misma región).',
          'Estaba junto al camino de la sierra que unía Jerusalén con Hebrón; por eso tenía “mesón” para viajeros (Lc 2:7).'),
        H('🏛️ Cultura y religión',
          'Sus habitantes eran judíos de la tribu de Judá. Su vida religiosa giraba en torno a Jerusalén y su templo, a menos de dos horas a pie.',
          'Se calcula que en tiempos de Jesús era una aldea de pocos cientos de habitantes. Era un pueblo humilde, no una ciudad importante.',
          'Las casas solían tener una parte baja o una cueva donde se guardaban los animales de noche; de ahí se entiende el pesebre (comedero).'),
    ],
    'cristo': 'El Rey eterno nació en la “casa del pan”, en un pueblo pequeño, como dijo Miqueas siete siglos antes. Dios cumple su palabra al detalle, y escoge lo pequeño para mostrar su grandeza.',
    'pregunta': P('¿Por qué Miqueas dice “Belén Efrata” y no solo “Belén”?',
                  ['Efrata era el nombre antiguo de esa Belén, la de Judá', 'Efrata era otra ciudad cercana', 'Era un título del rey'], 0, 'Gn 35:19',
                  'Génesis dice “Efrata, la cual es Belén”. Había otra Belén en Zabulón; “Efrata” señala la de Judá.'),
},

'Nazaret': {
    'titulo': 'La aldea donde Jesús se crió',
    'hoy': 'Baja Galilea (norte de Israel), en lo alto de una colina a unos 350 m.',
    'clave': 'Jn 1:46',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('El ángel Gabriel fue enviado a Nazaret, a una virgen desposada con José, “de la casa de David”.', 'Lc 1:26-27'),
          ('Al volver de Egipto, José se fue a Galilea por miedo a Arquelao, avisado en sueños.', 'Mt 2:22'),
          ('Habitó en Nazaret “para que se cumpliese… que habría de ser llamado nazareno”.', 'Mt 2:23'),
          ('Jesús creció allí “en sabiduría y en estatura”, sujeto a sus padres.', 'Lc 2:51-52'),
          ('Tenía sinagoga, y la ciudad estaba edificada sobre un monte con un despeñadero.', 'Lc 4:29')),
        B('👥 ¿Quiénes eran? ¿Judíos? ¿Ricos o pobres?',
          ('Eran judíos: Jesús iba a la sinagoga de Nazaret el día de reposo, “conforme a su costumbre”.', 'Lc 4:16'),
          ('José era “de la casa y familia de David”, de la tribu de Judá, aunque vivía en Galilea.', 'Lc 2:4'),
          ('Eran pobres: en la presentación ofrecieron “un par de tórtolas”, la ofrenda que la ley permitía al que no podía comprar un cordero.', 'Lv 12:8'),
          ('José, y luego Jesús, eran “carpinteros” (en griego tekton: artesano de madera y piedra, constructor).', 'Mr 6:3'),
          ('La Biblia no dice el linaje de todos los vecinos; sí dice que la familia de Jesús descendía de David.', 'Lc 1:26-27')),
        B('🙄 Un pueblo despreciado',
          ('Natanael preguntó: “¿De Nazaret puede salir algo de bueno?”', 'Jn 1:46'),
          ('Los fariseos decían que de Galilea nunca se había levantado profeta.', 'Jn 7:52'),
          ('Los galileos se notaban por su manera de hablar.', 'Mt 26:73'),
          ('A los cristianos los llamaron con desprecio “la secta de los nazarenos”.', 'Hch 24:5')),
        H('🌾 Economía y cultura',
          'El Antiguo Testamento no la menciona; tampoco el historiador Josefo. Era una aldea pequeña: los arqueólogos calculan unos pocos cientos de habitantes.',
          'Vivían de la agricultura en terrazas (olivos, viñas, trigo) y de pequeños rebaños. Se han hallado cisternas, silos para grano, lagares y prensas de aceite.',
          'Se han encontrado vasijas de piedra (usadas por judíos para la pureza ritual) y tumbas judías: confirma que era un pueblo judío observante.',
          'A unos 6 km estaba Séforis, que Herodes Antipas reconstruía como capital de Galilea: había trabajo para constructores de la región.',
          'Por el valle de Jezreel, al sur, pasaban rutas comerciales; Nazaret quedaba apartada en la colina, lejos del bullicio.'),
        B('🏷️ “Será llamado nazareno”: ¿qué profecía es?',
          ('Mateo dice “los profetas” (en plural), no cita un solo versículo.', 'Mt 2:23'),
          ('Muchos intérpretes conservadores ven un juego con la palabra hebrea netzer, “vástago”, de Isaías 11:1.', 'Is 11:1-2'),
          ('Otros ven el sentido de “despreciado”, como anunciaron los profetas del Mesías.', 'Is 53:3'),
          ('Las dos lecturas salen del texto y no se contradicen. En la cruz, Pilato escribió: “JESÚS NAZARENO, REY DE LOS JUDÍOS”.', 'Jn 19:19')),
    ],
    'cristo': 'El Hijo de David no creció en un palacio, sino en una aldea pobre y despreciada. Así se cumplió que sería “despreciado y desechado”, y nadie puede decir que Cristo no entiende la vida humilde.',
    'pregunta': P('¿Cómo sabemos por la Biblia que la familia de Jesús era pobre?',
                  ['Porque ofrecieron tórtolas, la ofrenda del que no podía comprar un cordero', 'Porque vivían en una cueva', 'Porque no pagaron el censo'], 0, 'Lc 2:24',
                  'Lucas 2:24 con Levítico 12:8: “si no tiene lo suficiente para un cordero, tomará… dos tórtolas”.'),
},

'Jerusalén': {
    'titulo': 'Salem · Sion · la ciudad del gran Rey',
    'hoy': 'En la sierra central, entre 750 y 800 m de altura; por eso se dice “subir a Jerusalén”.',
    'clave': '2 Cr 3:1',
    'secciones': [
        B('🏷️ Sus nombres',
          ('Salem: allí Melquisedec, rey de Salem, sacó pan y vino a Abram.', 'Gn 14:18'),
          ('Salem y Sion se usan como nombres de la ciudad de Dios.', 'Sal 76:2'),
          ('Era de los jebuseos hasta que David tomó la fortaleza de Sion: “la ciudad de David”.', '2 S 5:6-7'),
          ('El templo se edificó en el monte Moriah.', '2 Cr 3:1')),
        B('🙏 Religión: el centro de la fe de Israel',
          ('Todo varón debía presentarse ante Jehová tres veces al año: Panes sin levadura, Semanas y Tabernáculos.', 'Dt 16:16'),
          ('José y María subían cada año a la Pascua; Jesús fue a los doce años.', 'Lc 2:41-42'),
          ('El templo de Salomón fue quemado por Babilonia.', '2 R 25:9'),
          ('El templo que conoció Jesús llevaba 46 años en obra cuando él empezó su ministerio.', 'Jn 2:20'),
          ('Había judíos piadosos “de todas las naciones bajo el cielo”.', 'Hch 2:5')),
        B('🏛️ Poder y política en el nacimiento de Cristo',
          ('Herodes reinaba bajo Roma; al oír de un rey nacido, “se turbó, y toda Jerusalén con él”.', 'Mt 2:3'),
          ('Los escribas sabían dónde nacería el Cristo: en Belén, por Miqueas 5:2.', 'Mt 2:5-6')),
        H('💰 Economía y comercio',
          'La economía giraba en torno al templo: venta de animales para sacrificios, cambio de monedas para pagar el impuesto del templo (Mt 21:12), y hospedaje y comida para miles de peregrinos.',
          'Había artesanos (alfareros, tejedores, curtidores, canteros), mercados y obras de construcción. Herodes el Grande amplió el templo con enormes bloques de piedra.',
          'Agua: estanques y túneles, como Betesda (Jn 5:2) y Siloé.',
          'La población se calcula en decenas de miles, y crecía mucho en las fiestas. Los cálculos de los historiadores varían.'),
        H('🏛️ Grupos religiosos',
          'Sacerdotes y levitas servían en el templo. El Sanedrín era el consejo judío.',
          'Los saduceos, aristocracia sacerdotal, negaban la resurrección; los fariseos, maestros de la ley, añadían tradiciones; los escribas eran los expertos en las Escrituras.'),
        B('✝️ Jerusalén en la obra de Cristo',
          ('Jesús lloró sobre la ciudad.', 'Lc 19:41'),
          ('Padeció “fuera de la puerta” para santificar al pueblo con su sangre.', 'Hb 13:12'),
          ('Juan vio “la nueva Jerusalén” descender del cielo.', 'Ap 21:2')),
    ],
    'cristo': 'La ciudad de los sacrificios fue el lugar del sacrificio final. En el monte donde se ofrecían corderos, el Cordero de Dios murió una vez y para siempre.',
    'pregunta': P('¿En qué monte edificó Salomón el templo?',
                  ['Moriah', 'Sinaí', 'Gerizim'], 0, '2 Cr 3:1', 'Segunda de Crónicas 3:1 dice: “en Jerusalén, en el monte Moriah”.'),
},

'Ramá': {
    'titulo': 'Donde “Raquel llora a sus hijos”',
    'hoy': 'Al norte de Jerusalén, unos 8 km (ubicación tradicional: er-Ram). La ubicación exacta se discute.',
    'clave': 'Jer 31:15',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('Era una ciudad de la tribu de Benjamín.', 'Jos 18:25'),
          ('Baasa, rey de Israel, la fortificó para cerrar el paso a Judá: era un punto de frontera.', '1 R 15:17'),
          ('Allí se reunía a los cautivos que iban a Babilonia; Jeremías fue soltado “desde Ramá”.', 'Jer 40:1'),
          ('Samuel tenía su casa en “Ramá” (muchos la identifican con Ramataim; no es seguro que sea la misma).', '1 S 7:17')),
        B('😢 ¿Por qué Raquel?',
          ('Raquel, madre de José y de Benjamín, murió y fue sepultada en el camino de Efrata.', 'Gn 35:19'),
          ('Jeremías la presenta llorando en Ramá por sus hijos que iban al destierro.', 'Jer 31:15'),
          ('Mateo aplica esas palabras al llanto de Belén cuando Herodes mató a los niños.', 'Mt 2:18'),
          ('Raquel no fue sepultada en Ramá: el profeta la presenta como madre de Israel que llora. Es lenguaje poético del propio texto, no un relato de su tumba.', 'Jer 31:15')),
        H('🌾 Economía y geografía',
          'Pueblo de colina sobre la carretera de la sierra que va de norte a sur. Agricultura de secano: cereales, olivos y viñas.',
          'Por estar en la frontera entre los reinos de Judá e Israel, tuvo valor militar.'),
    ],
    'cristo': 'Mateo une dos dolores: el del destierro y el de Belén. El Niño que escapó a Egipto es el mismo que un día secará toda lágrima (Ap 21:3-4).',
    'pregunta': P('¿A qué hecho aplica Mateo el llanto de Raquel en Ramá?',
                  ['A la matanza de los niños de Belén por Herodes', 'A la muerte de Raquel', 'A la huida a Egipto'], 0, 'Mt 2:18',
                  'Mateo 2:16-18: Herodes mató a los niños, y se cumplió Jeremías 31:15.'),
},

'Egipto': {
    'titulo': 'Refugio, esclavitud y salida',
    'hoy': 'Noreste de África. El punto marca el delta del Nilo como referencia; el texto no dice a qué ciudad fueron.',
    'clave': 'Os 11:1',
    'secciones': [
        B('📖 Egipto en la historia de la promesa',
          ('Abram bajó a Egipto por el hambre.', 'Gn 12:10'),
          ('De toda la tierra iban a Egipto a comprar grano de José.', 'Gn 41:57'),
          ('Jacob y su familia habitaron en Gosén, “lo mejor de la tierra”.', 'Gn 47:6'),
          ('Después Israel fue esclavizado y construyó las ciudades de almacenaje Pitón y Ramesés.', 'Éx 1:11'),
          ('“De Egipto llamé a mi hijo”: Mateo lo aplica al regreso de Jesús.', 'Mt 2:15')),
        B('🙏 Religión',
          ('Egipto adoraba a muchos dioses; las plagas fueron juicio “en todos los dioses de Egipto”.', 'Éx 12:12'),
          ('Moisés fue educado “en toda la sabiduría de los egipcios”.', 'Hch 7:22')),
        H('💰 Economía y comercio',
          'El Nilo hacía de Egipto el granero de la región. En tiempos de Jesús era provincia romana (desde el año 30 a. C.) y enviaba trigo a Roma; Pablo viajó en una “nave alejandrina” (Hch 27:6).',
          'Exportaba papiro (para escribir), lino, vidrio y piedra.',
          'Alejandría tenía una comunidad judía muy grande. Allí se tradujo el Antiguo Testamento al griego (la Septuaginta), siglos antes de Cristo.'),
        H('🧭 ¿Por qué huir a Egipto?',
          'Estaba fuera del dominio de Herodes, pero bajo la misma Roma, con caminos conocidos por la costa.',
          'Había muchos judíos: una familia judía podía vivir allí entre los suyos.',
          'Según la mayoría de los historiadores, Herodes murió hacia el año 4 a. C. Al morir él, el ángel avisó a José en sueños que regresara (Mt 2:19-20).'),
    ],
    'cristo': 'Israel salió de Egipto y cayó en el desierto; Cristo salió de Egipto y obedeció en todo. Él es el Hijo fiel que cumple lo que el pueblo no pudo.',
    'pregunta': P('¿Por qué Egipto era un buen refugio para la familia de Jesús?',
                  ['Estaba fuera del poder de Herodes y había muchos judíos', 'Porque allí no había romanos', 'Porque José tenía tierras allí'], 0, 'Mt 2:15',
                  'Herodes no gobernaba Egipto, y Alejandría tenía una comunidad judía muy grande. Dios usó eso para guardar al Niño.'),
},

'Ur': {
    'titulo': 'Ur de los caldeos · de donde Dios sacó a Abraham',
    'hoy': 'Sur de Irak, cerca del río Éufrates (Tell el-Muqayyar).',
    'clave': 'Jos 24:2-3',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('Allí nació la familia de Taré; su hijo Harán murió en Ur de los caldeos.', 'Gn 11:28'),
          ('Taré salió de Ur con Abram, Sarai y Lot rumbo a Canaán.', 'Gn 11:31'),
          ('El Dios de la gloria se le apareció a Abraham “estando en Mesopotamia, antes que morase en Harán”.', 'Hch 7:2-4'),
          ('La familia de Taré “servía a dioses extraños”: Dios llamó a Abraham por gracia, no por mérito.', 'Jos 24:2-3')),
        H('🙏 Religión',
          'Su gran torre escalonada (zigurat) estaba dedicada al dios luna, Nanna (o Sin). La ciudad era un centro de idolatría.'),
        H('💰 Economía y cultura',
          'Excavada por Leonard Woolley (1922-1934). Ciudad grande y rica: comercio por río hacia el golfo Pérsico, agricultura con canales de riego, tejidos y metalurgia.',
          'Tenía escritura cuneiforme, escuelas y archivos; en las “tumbas reales” se hallaron joyas de oro y lapislázuli.',
          'Abraham no dejó un desierto: dejó una de las ciudades más avanzadas de su época.'),
    ],
    'cristo': 'La historia de la salvación empieza con Dios llamando a un idólatra. Así nos llama hoy en Cristo: no por lo que somos, sino por gracia (Ef 2:8-9).',
    'pregunta': P('¿Qué hacía la familia de Taré antes del llamado de Dios?',
                  ['Servía a dioses extraños', 'Adoraba solo a Jehová', 'Eran sacerdotes de Jerusalén'], 0, 'Jos 24:2-3',
                  'Josué 24:2: “servían a dioses extraños”. El llamado fue pura gracia.'),
},

'Harán': {
    'titulo': 'La parada en el camino',
    'hoy': 'Sureste de Turquía, cerca de Şanlıurfa.',
    'clave': 'Gn 12:4-5',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('Taré murió en Harán.', 'Gn 11:32'),
          ('Abram salió de Harán a los 75 años, con Sarai, Lot y todo lo que tenían.', 'Gn 12:4-5'),
          ('El siervo de Abraham fue a Mesopotamia, a la ciudad de Nacor, a buscar esposa para Isaac.', 'Gn 24:10'),
          ('Jacob huyó a Harán, a casa de Labán.', 'Gn 28:10'),
          ('Raquel hurtó los ídolos de su padre: en la casa de Labán había ídolos.', 'Gn 31:19')),
        H('💰 Economía y cultura',
          'Su nombre antiguo (harranu) se relaciona con “camino” o “ruta de caravanas”: era un cruce comercial entre Mesopotamia, Siria y Anatolia.',
          'Vivían del comercio de caravanas y del pastoreo de ovejas y cabras, como muestra el trabajo de Jacob con los rebaños de Labán.'),
        H('🙏 Religión',
          'Como Ur, era un gran centro de culto al dios luna, Sin.'),
    ],
    'cristo': 'Harán fue una parada, no el destino. Dios no deja a medias a los que llama: los lleva hasta la tierra prometida (Fil 1:6).',
    'pregunta': P('¿Qué edad tenía Abram cuando salió de Harán?',
                  ['75 años', '100 años', '40 años'], 0, 'Gn 12:4-5', 'Génesis 12:4: “era Abram de edad de setenta y cinco años cuando salió de Harán”.'),
},

'Siquem': {
    'titulo': 'Donde Dios prometió la tierra',
    'hoy': 'Cerca de Nablus (Tell Balata), entre los montes Ebal y Gerizim.',
    'clave': 'Gn 12:6-7',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('Primer lugar de Canaán donde se detuvo Abram; allí Dios prometió: “A tu descendencia daré esta tierra”.', 'Gn 12:6-7'),
          ('Jacob compró allí un campo y levantó un altar.', 'Gn 33:18-20'),
          ('Allí se enterraron los huesos de José, traídos de Egipto.', 'Jos 24:32'),
          ('Entre Gerizim y Ebal se pronunciaban la bendición y la maldición de la ley.', 'Dt 11:29'),
          ('Jeroboam la reedificó y vivió allí.', '1 R 12:25')),
        B('✝️ En tiempos de Jesús',
          ('Jesús se sentó junto al pozo de Jacob, cerca de Sicar.', 'Jn 4:5-6'),
          ('“Judíos y samaritanos no se tratan entre sí.”', 'Jn 4:9'),
          ('Los samaritanos adoraban en el monte Gerizim, y no en Jerusalén.', 'Jn 4:20')),
        H('💰 Economía y geografía',
          'Valle fértil con manantiales, en el cruce de caminos de norte a sur y de este a oeste: un lugar de paso y de comercio.',
          'Cereales, olivos y viñas. Los arqueólogos han hallado murallas y un gran templo cananeo de la época de los patriarcas.'),
    ],
    'cristo': 'Donde Dios prometió la tierra a Abraham, siglos después Cristo ofreció agua viva a una samaritana. La promesa a Abraham era para bendecir a todas las familias de la tierra (Gn 12:3).',
    'pregunta': P('¿Qué prometió Dios a Abram en Siquem?',
                  ['“A tu descendencia daré esta tierra”', 'Que sería rey de Egipto', 'Que viviría en Harán'], 0, 'Gn 12:6-7', 'Génesis 12:7.'),
},

'Monte Sinaí': {
    'titulo': 'Horeb, el monte de Dios',
    'hoy': 'Ubicación tradicional: Jebel Musa, en el sur de la península del Sinaí (Egipto). La Biblia no da coordenadas y hay otras propuestas.',
    'clave': 'Jn 1:17',
    'secciones': [
        B('📖 Lo que dice la Biblia',
          ('También se llama Horeb, “monte de Dios”; allí Dios llamó a Moisés.', 'Éx 3:1'),
          ('Israel llegó al desierto de Sinaí al tercer mes de salir de Egipto.', 'Éx 19:1'),
          ('Allí Dios hizo pacto con Israel y le dio la ley.', 'Dt 5:2'),
          ('“Yo soy Jehová tu Dios, que te saqué de la tierra de Egipto… No tendrás dioses ajenos delante de mí.”', 'Éx 20:2-3'),
          ('Estuvieron allí casi un año, hasta que la nube se alzó en el segundo año.', 'Nm 10:11-12'),
          ('Elías caminó cuarenta días hasta Horeb.', '1 R 19:8')),
        B('🧭 ¿Dónde está?',
          ('Pablo dice “el monte Sinaí en Arabia”. En su tiempo “Arabia” podía incluir la península del Sinaí; por eso los intérpretes difieren.', 'Gá 4:25')),
        H('🏜️ Economía y vida en el desierto',
          'No era una ciudad: era desierto de montaña con poca agua. Allí solo vivían pastores nómadas.',
          'Israel no sobrevivió por comercio ni cultivos, sino porque Dios les dio el maná durante cuarenta años (Éx 16:35).'),
    ],
    'cristo': 'La ley de Sinaí muestra el pecado y nos lleva a Cristo como un ayo (Gá 3:24). “La ley por medio de Moisés fue dada, pero la gracia y la verdad vinieron por medio de Jesucristo.”',
    'pregunta': P('¿Qué otro nombre tiene el monte Sinaí en la Biblia?',
                  ['Horeb', 'Moriah', 'Carmelo'], 0, 'Éx 3:1', 'Éxodo 3:1: “llegó hasta Horeb, monte de Dios”.'),
},
}


def validar():
    for n, c in CIUDADES.items():
        k = c['clave']
        assert k in V or k in VC, f'{n}: versículo clave sin texto verificado: {k}'
        c['clave'] = {'cita': k, 'texto': V.get(k) or VC[k]}
        for s in c['secciones']:
            assert s['fuente'] in ('biblia', 'historia')
            for it in s['items']:
                if s['fuente'] == 'biblia':
                    assert it['cita'] in VERIFICADAS, f'{n}: cita sin verificar {it["cita"]}'
        q = c['pregunta']
        assert q['cita'] in VERIFICADAS, f'{n}: cita de pregunta sin verificar {q["cita"]}'
        assert 0 <= q['respuesta'] < len(q['opciones'])
    return CIUDADES
