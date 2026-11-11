"""Genealogías de Jesucristo: Mateo 1:1-17 y Lucas 3:23-38 (RVR1960, cotejado en Bible Gateway, 2026-11-11).

Contiene:
  - GEN: datos para la pantalla interactiva (cadenas de nombres, notas, comparación, retos).
  - NIVELES_JA / NIVELES_NI: niveles que se añaden al bloque 7 (antes de Mt 1:18).
Todo nombre de la cadena se comprueba contra el texto; toda cita bíblica de las notas debe tener texto verificado.
"""
import re
from versiculos import V

V.update({
    'Mt 1:1': 'Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham.',
    'Mt 1:1-17': 'Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham. Abraham engendró a Isaac, Isaac a Jacob, y Jacob a Judá y a sus hermanos. Judá engendró de Tamar a Fares y a Zara, Fares a Esrom, y Esrom a Aram. Aram engendró a Aminadab, Aminadab a Naasón, y Naasón a Salmón. Salmón engendró de Rahab a Booz, Booz engendró de Rut a Obed, y Obed a Isaí. Isaí engendró al rey David, y el rey David engendró a Salomón de la que fue mujer de Urías. Salomón engendró a Roboam, Roboam a Abías, y Abías a Asa. Asa engendró a Josafat, Josafat a Joram, y Joram a Uzías. Uzías engendró a Jotam, Jotam a Acaz, y Acaz a Ezequías. Ezequías engendró a Manasés, Manasés a Amón, y Amón a Josías. Josías engendró a Jeconías y a sus hermanos, en el tiempo de la deportación a Babilonia. Después de la deportación a Babilonia, Jeconías engendró a Salatiel, y Salatiel a Zorobabel. Zorobabel engendró a Abiud, Abiud a Eliaquim, y Eliaquim a Azor. Azor engendró a Sadoc, Sadoc a Aquim, y Aquim a Eliud. Eliud engendró a Eleazar, Eleazar a Matán, Matán a Jacob; y Jacob engendró a José, marido de María, de la cual nació Jesús, llamado el Cristo. De manera que todas las generaciones desde Abraham hasta David son catorce; desde David hasta la deportación a Babilonia, catorce; y desde la deportación a Babilonia hasta Cristo, catorce.',
    'Mt 1:5-6': 'Salmón engendró de Rahab a Booz, Booz engendró de Rut a Obed, y Obed a Isaí. Isaí engendró al rey David, y el rey David engendró a Salomón de la que fue mujer de Urías.',
    'Mt 1:3': 'Judá engendró de Tamar a Fares y a Zara, Fares a Esrom, y Esrom a Aram.',
    'Mt 1:16': 'y Jacob engendró a José, marido de María, de la cual nació Jesús, llamado el Cristo.',
    'Mt 1:17': 'De manera que todas las generaciones desde Abraham hasta David son catorce; desde David hasta la deportación a Babilonia, catorce; y desde la deportación a Babilonia hasta Cristo, catorce.',
    'Lc 3:23-38': 'Jesús mismo al comenzar su ministerio era como de treinta años, hijo, según se creía, de José, hijo de Elí, hijo de Matat, hijo de Leví, hijo de Melqui, hijo de Jana, hijo de José, hijo de Matatías, hijo de Amós, hijo de Nahum, hijo de Esli, hijo de Nagai, hijo de Maat, hijo de Matatías, hijo de Semei, hijo de José, hijo de Judá, hijo de Joana, hijo de Resa, hijo de Zorobabel, hijo de Salatiel, hijo de Neri, hijo de Melqui, hijo de Adi, hijo de Cosam, hijo de Elmodam, hijo de Er, hijo de Josué, hijo de Eliezer, hijo de Jorim, hijo de Matat, hijo de Leví, hijo de Simeón, hijo de Judá, hijo de José, hijo de Jonán, hijo de Eliaquim, hijo de Melea, hijo de Mainán, hijo de Matata, hijo de Natán, hijo de David, hijo de Isaí, hijo de Obed, hijo de Booz, hijo de Salmón, hijo de Naasón, hijo de Aminadab, hijo de Aram, hijo de Esrom, hijo de Fares, hijo de Judá, hijo de Jacob, hijo de Isaac, hijo de Abraham, hijo de Taré, hijo de Nacor, hijo de Serug, hijo de Ragau, hijo de Peleg, hijo de Heber, hijo de Sala, hijo de Cainán, hijo de Arfaxad, hijo de Sem, hijo de Noé, hijo de Lamec, hijo de Matusalén, hijo de Enoc, hijo de Jared, hijo de Mahalaleel, hijo de Cainán, hijo de Enós, hijo de Set, hijo de Adán, hijo de Dios.',
    'Lc 3:23': 'Jesús mismo al comenzar su ministerio era como de treinta años, hijo, según se creía, de José, hijo de Elí,',
    'Lc 3:31-32': 'hijo de Melea, hijo de Mainán, hijo de Matata, hijo de Natán, hijo de David, hijo de Isaí, hijo de Obed, hijo de Booz, hijo de Salmón, hijo de Naasón,',
    'Lc 3:38': 'hijo de Enós, hijo de Set, hijo de Adán, hijo de Dios.',
    'Jer 22:30': 'Así ha dicho Jehová: Escribid lo que sucederá a este hombre privado de descendencia, hombre a quien nada próspero sucederá en todos los días de su vida; porque ninguno de su descendencia logrará sentarse sobre el trono de David, ni reinar sobre Judá.',
    '1 Cr 3:10-12': 'Hijo de Salomón fue Roboam, cuyo hijo fue Abías, del cual fue hijo Asa, cuyo hijo fue Josafat, de quien fue hijo Joram, cuyo hijo fue Ocozías, hijo del cual fue Joás, del cual fue hijo Amasías, cuyo hijo fue Azarías, e hijo de este, Jotam.',
    'Rt 4:18-22': 'Estas son las generaciones de Fares: Fares engendró a Hezrón, Hezrón engendró a Ram, y Ram engendró a Aminadab, Aminadab engendró a Naasón, y Naasón engendró a Salmón, Salmón engendró a Booz, y Booz engendró a Obed, Obed engendró a Isaí, e Isaí engendró a David.',
    'Jos 6:25': 'Mas Josué salvó la vida a Rahab la ramera, y a la casa de su padre, y a todo lo que ella tenía; y habitó ella entre los israelitas hasta hoy, por cuanto escondió a los mensajeros que Josué había enviado a reconocer a Jericó.',
    '2 S 12:24': 'Y consoló David a Betsabé su mujer, y llegándose a ella durmió con ella; y ella le dio a luz un hijo, y llamó su nombre Salomón, al cual amó Jehová,',
    'Ro 1:3': 'acerca de su Hijo, nuestro Señor Jesucristo, que era del linaje de David según la carne,',
    'Hb 7:14': 'Porque manifiesto es que nuestro Señor vino de la tribu de Judá, de la cual nada habló Moisés tocante al sacerdocio.',
})

from helpers import O, C, R, DEV, NIVEL, MEM  # noqa: E402  (después de V.update)

# ---------- cadenas ----------
MATEO = ['Abraham', 'Isaac', 'Jacob', 'Judá', 'Fares', 'Esrom', 'Aram', 'Aminadab', 'Naasón', 'Salmón', 'Booz', 'Obed', 'Isaí', 'David',
         'Salomón', 'Roboam', 'Abías', 'Asa', 'Josafat', 'Joram', 'Uzías', 'Jotam', 'Acaz', 'Ezequías', 'Manasés', 'Amón', 'Josías',
         'Jeconías', 'Salatiel', 'Zorobabel', 'Abiud', 'Eliaquim', 'Azor', 'Sadoc', 'Aquim', 'Eliud', 'Eleazar', 'Matán', 'Jacob', 'José', 'Jesús']
# Mt 1:17 dice «desde Abraham hasta David», «desde David hasta la deportación» y «desde la deportación hasta Cristo»:
# una forma sencilla de contar es que David cierra el primer grupo y abre el segundo.
GRUPOS_MT = [
    {'titulo': 'De Abraham a David', 'sub': 'Los patriarcas y la tribu de Judá', 'desde': 0, 'hasta': 13},
    {'titulo': 'De David a la deportación', 'sub': 'Los reyes de Judá', 'desde': 13, 'hasta': 26},
    {'titulo': 'De la deportación a Cristo', 'sub': 'Después de Babilonia', 'desde': 27, 'hasta': 40},
]
TXT_LC = V['Lc 3:23-38']
LUCAS = ['Jesús'] + re.findall(r'hijo(?:, según se creía,)? de ([A-ZÁÉÍÓÚ][a-záéíóúñ]+)', TXT_LC)

MUJERES = ['Tamar', 'Rahab', 'Rut', 'la que fue mujer de Urías', 'María']

NOTAS = {  # nombre -> (texto, cita con texto verificado)
    'Abraham': ('A él se le prometió que en su simiente serían benditas todas las naciones. Mateo empieza aquí: Jesús es «hijo de Abraham».', 'Gn 22:18'),
    'Judá': ('Jacob profetizó que el cetro no sería quitado de Judá «hasta que venga Siloh». Jesús vino de esta tribu.', 'Gn 49:10'),
    'Fares': ('Hijo de Judá y de Tamar. Rut 4 sigue la misma línea desde Fares hasta David.', 'Rt 4:18-22'),
    'Booz': ('Hijo de Rahab, la de Jericó, y esposo de Rut la moabita.', 'Mt 1:5-6'),
    'Obed': ('Hijo de Booz y Rut, abuelo de David.', 'Rt 4:17'),
    'David': ('Dios le prometió un descendiente cuyo reino sería afirmado para siempre. Por eso Jesús es «hijo de David».', '2 S 7:12-13'),
    'Salomón': ('Hijo de David y de Betsabé, «la que fue mujer de Urías». Mateo sigue la línea real por Salomón.', '2 S 12:24'),
    'Joram': ('Entre Joram y Uzías (Azarías), Crónicas nombra a Ocozías, Joás y Amasías. Mateo los omite: «engendró» puede significar «fue antepasado de», y Mateo ordena la lista en tres grupos de catorce.', '1 Cr 3:10-12'),
    'Uzías': ('También llamado Azarías en 1 Crónicas 3:12.', '1 Cr 3:10-12'),
    'Jeconías': ('Dios dijo que ninguno de su descendencia se sentaría en el trono de David. Muchos intérpretes conservadores señalan que Jesús no era hijo de José según la carne, así que recibe el derecho legal sin caer bajo esa sentencia.', 'Jer 22:30'),
    'Zorobabel': ('Aparece en las dos genealogías (con Salatiel). Los intérpretes difieren sobre si son las mismas personas.', 'Mt 1:1-17'),
    'José': ('Mateo no dice «José engendró a Jesús», sino «José, marido de María, de la cual nació Jesús». Así guarda el nacimiento virginal.', 'Mt 1:16'),
    'Jesús': ('«Llamado el Cristo»: el Mesías prometido. Hijo de David y de Abraham.', 'Mt 1:16'),
    'Natán': ('Hijo de David, hermano de Salomón. Lucas sigue la línea por Natán, no por Salomón.', 'Lc 3:31-32'),
    'Elí': ('Lucas dice que Jesús era «hijo, según se creía, de José, hijo de Elí». Ver «Comparar» para las dos explicaciones.', 'Lc 3:23'),
    'Adán': ('Lucas llega hasta Adán, «hijo de Dios»: Jesús vino para toda la humanidad caída en Adán.', 'Lc 3:38'),
    'Dios': ('Lucas termina en Dios: Adán fue creado por Él, no engendrado por hombre.', 'Lc 3:38'),
}
NOTAS_MUJER = {
    'Tamar': ('Judá tuvo a Fares y a Zara de Tamar (Génesis 38). Su historia está marcada por el pecado de Judá, y aun así Dios la incluyó en la línea del Mesías.', 'Mt 1:3'),
    'Rahab': ('La ramera de Jericó, cananea. Escondió a los mensajeros y Josué le salvó la vida (Hebreos 11:31 dice que lo hizo por la fe). Fue madre de Booz.', 'Jos 6:25'),
    'Rut': ('Moabita, no israelita. Por la gracia de Dios llegó a ser bisabuela del rey David.', 'Rt 4:17'),
    'la que fue mujer de Urías': ('Betsabé. Mateo no dice su nombre, sino «la que fue mujer de Urías», y recuerda el pecado de David. Dios no lo esconde.', 'Mt 1:5-6'),
    'María': ('La fórmula cambia: no dice «engendró», sino «de la cual nació Jesús». La Biblia enseña que Jesús nació de una virgen.', 'Mt 1:16'),
}

COMPARAR = [
    {'t': 'Dirección', 'mt': 'Baja: de Abraham a Jesús.', 'lc': 'Sube: de Jesús a Adán y a Dios.', 'cita': 'Mt 1:1-17; Lc 3:23-38'},
    {'t': 'Empieza o termina en', 'mt': 'Abraham: Jesús es el hijo prometido a Israel.', 'lc': 'Adán, «hijo de Dios»: Jesús es el Salvador para toda la humanidad.', 'cita': 'Mt 1:1; Lc 3:38'},
    {'t': 'Hijo de David por', 'mt': 'Salomón, la línea de los reyes.', 'lc': 'Natán, otro hijo de David.', 'cita': 'Mt 1:6; Lc 3:31'},
    {'t': 'Orden', 'mt': 'Tres grupos de catorce, fácil de memorizar.', 'lc': 'Una lista corrida, sin grupos.', 'cita': 'Mt 1:17'},
    {'t': 'Mujeres', 'mt': 'Nombra a Tamar, Rahab, Rut, «la que fue mujer de Urías» y María.', 'lc': 'No nombra mujeres.', 'cita': 'Mt 1:3-16'},
    {'t': 'José', 'mt': '«José, marido de María, de la cual nació Jesús».', 'lc': '«hijo, según se creía, de José, hijo de Elí».', 'cita': 'Mt 1:16; Lc 3:23'},
]
POR_QUE_DIFIEREN = [
    ('Lo que dicen las dos', 'Ambas muestran que Jesús es del linaje de David y de la tribu de Judá, como exigían las profecías.', 'Ro 1:3'),
    ('Mateo: el derecho legal al trono', 'Mateo sigue a José por Salomón y los reyes. José era el padre legal de Jesús; por él Jesús tiene el derecho legal al trono de David.', 'Mt 1:16'),
    ('Lucas, explicación 1: la línea de María', 'Muchos intérpretes conservadores entienden que Lucas da la línea de María. Elí sería el padre de María y José su yerno; por eso Lucas dice «según se creía». Así Jesús es hijo de David también según la carne, por Natán.', 'Lc 3:23'),
    ('Lucas, explicación 2: las dos son de José', 'Otros, desde la iglesia antigua, entienden que las dos listas son de José: una legal y otra natural, por la ley del levirato (un hermano daba descendencia al hermano muerto).', 'Lc 3:23'),
    ('Lo que no se discute', 'Las dos explicaciones aceptan la Escritura tal como es. Ninguna lista contradice a la otra, y ninguna niega el nacimiento virginal: Mateo y Lucas lo cuidan con sus palabras.', 'Mt 1:16'),
]
CUAL = [  # ¿Mateo o Lucas?
    ('Empieza con Abraham', 'mt'), ('Llega hasta Adán', 'lc'), ('Pasa por Salomón', 'mt'), ('Pasa por Natán', 'lc'),
    ('Dice «según se creía»', 'lc'), ('Ordena en tres grupos de catorce', 'mt'), ('Nombra a cuatro mujeres además de María', 'mt'),
    ('Va de Jesús hacia atrás', 'lc'), ('Termina con «hijo de Dios»', 'lc'), ('Dice «de la cual nació Jesús»', 'mt'),
]
MUJ_DISTRACTORES = ['Sara', 'Rebeca', 'Raquel', 'Lea', 'Débora', 'Ana']

# ---------- niveles ----------
NIVELES_JA = [
 NIVEL('gen-ja-1', 'Hijo de David, hijo de Abraham', ['Mt 1:1-17'], [
   O('¿Con qué palabras empieza Mateo su genealogía?', ['Hijo de Adán', 'Hijo de David, hijo de Abraham', 'Hijo de Moisés', 'Hijo de Natán'], 1, 'Mt 1:1'),
   R('Ordena los tres grupos de Mateo.', ['De Abraham a David', 'De David a la deportación a Babilonia', 'De la deportación a Babilonia hasta Cristo'], 'Mt 1:17'),
   C('Completa: «todas las generaciones desde Abraham hasta David son ___».', 'catorce', 'Mt 1:17'),
   O('¿Por qué hijo de David sigue Mateo la línea?', ['Natán', 'Salomón', 'Absalón', 'Amnón'], 1, 'Mt 1:1-17', 'Mateo sigue la línea de los reyes: Salomón, Roboam, Abías…'),
   O('Entre Joram y Uzías, 1 Crónicas nombra a Ocozías, Joás y Amasías. ¿Qué nos enseña que Mateo los omita?', ['Que Mateo se equivocó', 'Que «engendró» puede significar «fue antepasado de», y Mateo agrupa en catorce', 'Que esos reyes no existieron', 'Que la lista es inventada'], 1, '1 Cr 3:10-12'),
 ], 'Jesús es el Hijo prometido a Abraham y el Rey prometido a David. Dios cumplió sus promesas a lo largo de cuarenta y dos generaciones.',
 DEV(['Mt 1:1-17'],
  'Mateo escribe para mostrar que Jesús es el Mesías. Por eso empieza con dos nombres: David, a quien Dios prometió un trono eterno (2 S 7:12-13), y Abraham, a quien prometió que en su simiente serían benditas todas las naciones (Gn 22:18). Ordena la lista en tres grupos de catorce (Mt 1:17): los patriarcas, los reyes y los años después de Babilonia.',
  'Dios cumple sus promesas a través de las generaciones',
  [('Hijo de Abraham', 'La bendición para las naciones vendría por la simiente de Abraham.', 'Gn 22:18'),
   ('Hijo de David', 'Dios prometió a David un reino afirmado para siempre.', '2 S 7:12-13'),
   ('Tres grupos de catorce', 'Subida con David, caída con Babilonia y espera hasta Cristo. Dios guió toda la historia.', 'Mt 1:17')],
  'Las listas de nombres no son aburridas: muestran que Dios fue fiel generación tras generación hasta enviar a Cristo.',
  ['Cuando una promesa de Dios parezca tardar, recuerda las cuarenta y dos generaciones de Mateo.', 'Lee Mateo 1 en voz alta y fíjate en los nombres que ya conoces.', 'Agradece que Jesús es el Rey que David esperaba.'],
  ('Mt 1:1', 'Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham.'),
  '¿Qué te enseña sobre Dios que guardara esta línea durante tantos siglos?')),

 NIVEL('gen-ja-2', 'Las mujeres de la genealogía: pura gracia', ['Mt 1:1-17'], [
   O('¿Cuál de estas mujeres NO aparece en la genealogía de Mateo?', ['Tamar', 'Rahab', 'Sara', 'Rut'], 2, 'Mt 1:3-6'),
   O('¿Cómo llama Mateo a Betsabé?', ['La reina madre', '«La que fue mujer de Urías»', 'La hija de Eliam', 'No la menciona'], 1, 'Mt 1:5-6'),
   O('¿Qué tenían en común Rahab y Rut?', ['Eran sacerdotisas', 'No eran israelitas de nacimiento', 'Eran hermanas', 'Eran reinas'], 1, 'Jos 6:25', 'Rahab era cananea de Jericó y Rut era moabita.'),
   C('Completa: «José, marido de María, de la cual nació ___».', 'Jesús', 'Mt 1:16'),
   O('¿Por qué Mateo dice «de la cual nació Jesús» y no «José engendró a Jesús»?', ['Por error', 'Porque Jesús nació de una virgen, sin padre humano', 'Porque José no estaba', 'Porque no se sabía'], 1, 'Mt 1:16'),
 ], 'Dios incluyó en la línea del Mesías a pecadores y extranjeros. La salvación es por gracia, no por mérito ni por linaje.',
 DEV(['Mt 1:3', 'Mt 1:5-6', 'Mt 1:16'],
  'En las genealogías judías casi no se nombraban mujeres. Mateo nombra a cuatro antes de María: Tamar (Gn 38), Rahab la ramera de Jericó (Jos 6:25), Rut la moabita y «la que fue mujer de Urías», que recuerda el pecado de David. Ninguna fue escogida por sus méritos. Al llegar a María, Mateo cambia las palabras para mostrar el nacimiento virginal (Mt 1:16).',
  'La gracia de Dios en la línea del Mesías',
  [('Dios no esconde el pecado', 'Mateo dice «la que fue mujer de Urías»: la Biblia no maquilla a sus héroes.', 'Mt 1:5-6'),
   ('Dios recibe a los extranjeros', 'Rahab y Rut no eran israelitas, y Dios las incluyó en la línea del Rey.', 'Jos 6:25'),
   ('El Hijo nacido de mujer', 'Jesús nació de María, sin padre humano.', 'Mt 1:16')],
  'Si Dios puso a estas mujeres en la historia de su Hijo, ningún pecador arrepentido está demasiado lejos de su gracia (Ef 2:8-9).',
  ['No pienses que tu pasado te deja fuera: la gracia de Dios alcanza al pecador que se arrepiente.', 'No desprecies a nadie por su origen.', 'Da gracias porque la salvación es por gracia, por medio de la fe (Ef 2:8-9).'],
  ('Mt 1:16', 'José, marido de María, de la cual nació Jesús, llamado el Cristo'),
  '¿Qué te dice de la gracia de Dios que estas mujeres estén en la genealogía de Jesús?')),

 NIVEL('gen-ja-3', 'Lucas: hasta Adán, hijo de Dios', ['Lc 3:23-38'], [
   O('¿Hasta quién llega la genealogía de Lucas?', ['Abraham', 'David', 'Adán, hijo de Dios', 'Noé'], 2, 'Lc 3:38'),
   O('¿Por cuál hijo de David pasa Lucas?', ['Salomón', 'Natán', 'Absalón', 'Adonías'], 1, 'Lc 3:31-32'),
   C('Completa: «hijo, según se ___, de José».', 'creía', 'Lc 3:23'),
   O('¿Qué afirman Mateo y Lucas por igual?', ['Que Jesús era de la tribu de Leví', 'Que Jesús es del linaje de David', 'Que José engendró a Jesús', 'Que Jesús venía de Egipto'], 1, 'Ro 1:3'),
   O('Según muchos intérpretes conservadores, ¿qué línea da Lucas?', ['La de María, con José como yerno de Elí', 'La de Herodes', 'La de los sacerdotes', 'Ninguna real'], 0, 'Lc 3:23', 'Otros entienden que ambas son de José (legal y natural). Las dos lecturas aceptan el texto tal como está.'),
 ], 'Jesús no solo es el Rey de Israel: es el Salvador de toda la humanidad que cayó en Adán.',
 DEV(['Lc 3:23', 'Lc 3:31-32', 'Lc 3:38'],
  'Lucas pone la genealogía después del bautismo de Jesús, al comenzar su ministerio. Va hacia atrás: de Jesús a David por Natán, luego a Abraham y hasta «Adán, hijo de Dios» (Lc 3:38). Dice que Jesús era hijo de José «según se creía» (Lc 3:23), porque Jesús no tuvo padre humano. Los intérpretes conservadores explican la diferencia con Mateo de dos maneras: Lucas daría la línea de María, o las dos serían de José (legal y natural). Ninguna niega el texto.',
  'El Salvador de los hijos de Adán',
  [('Según se creía', 'Lucas, que narró el nacimiento virginal, cuida sus palabras: José no fue su padre según la carne.', 'Lc 3:23'),
   ('Hijo de David', 'Por Natán, Jesús es del linaje de David.', 'Ro 1:3'),
   ('Hasta Adán', 'Por un hombre entró el pecado; por la obediencia de uno muchos serán constituidos justos.', 'Ro 5:19')],
  'Mateo muestra al Rey; Lucas muestra al Hombre perfecto que vino a salvar a los hijos de Adán.',
  ['Recuerda que Cristo vino por personas de toda nación, porque todos venimos de Adán.', 'Cuando encuentres diferencias en la Biblia, estúdialas con humildad y confianza en la Palabra.', 'Comparte que Jesús es Salvador para toda persona.'],
  ('Lc 3:38', 'hijo de Adán, hijo de Dios'),
  '¿Por qué crees que Lucas, que escribía también para no judíos, llevó la genealogía hasta Adán?')),
]

NIVELES_NI = [
 NIVEL('gen-ni-1', 'La familia de Jesús', ['Mt 1:1'], [
   O('¿De qué rey famoso era descendiente Jesús?', ['Saúl', 'David', 'Herodes'], 1, 'Mt 1:1'),
   O('¿Con quién empieza Mateo la lista?', ['Abraham', 'Noé', 'Moisés'], 0, 'Mt 1:1-17'),
   C('Completa: «hijo de David, hijo de ___».', 'Abraham', 'Mt 1:1'),
   O('¿Cuántos grupos de catorce hay en Mateo?', ['Dos', 'Tres', 'Siete'], 1, 'Mt 1:17'),
   R('Ordena a estos abuelos de Jesús.', ['Abraham', 'Isaac', 'Jacob', 'David'], 'Mt 1:2-6'),
 ], 'Dios cuidó a la familia de Jesús durante muchos años para cumplir lo que prometió.',
 DEV(['Mt 1:1'],
  'Mateo empieza su libro con una lista de nombres: la familia de Jesús. Quiere que sepamos que Jesús es «hijo de David» y «hijo de Abraham» (Mt 1:1). Dios había prometido a Abraham y a David que de su familia vendría el Salvador, y lo cumplió.',
  'Dios cumple lo que promete',
  [('Promesa a Abraham', 'De su familia vendría bendición para todo el mundo.', 'Gn 22:18'),
   ('Promesa a David', 'Un hijo suyo reinaría para siempre.', '2 S 7:12-13'),
   ('Jesús cumple las dos', 'Jesús es hijo de David e hijo de Abraham.', 'Mt 1:1')],
  'Dios siempre cumple sus promesas, aunque pasen muchos años.',
  ['Pregunta a tus padres o abuelos por tu familia y da gracias a Dios por ellos.', 'Aprende de memoria Mateo 1:1.', 'Confía en que Dios cumple lo que dice.'],
  ('Mt 1:1', 'Jesucristo, hijo de David, hijo de Abraham'),
  'Dibuja un árbol con Abraham, David y Jesús, y escribe por qué Dios cumplió su promesa.')),

 NIVEL('gen-ni-2', 'Dios ama a todos', ['Mt 1:5-6'], [
   O('¿De qué pueblo era Rut?', ['De Israel', 'De Moab', 'De Egipto'], 1, 'Rt 4:17', 'Rut era moabita, y Dios la puso en la familia de Jesús.'),
   O('¿Quién era la mamá de Booz?', ['Rahab', 'Sara', 'Lea'], 0, 'Mt 1:5-6'),
   C('Completa: «Booz engendró de ___ a Obed».', 'Rut', 'Mt 1:5-6'),
   O('¿Qué nos enseña que Rut y Rahab estén en la familia de Jesús?', ['Que Dios recibe a quien confía en él, venga de donde venga', 'Que solo importa ser israelita', 'Nada'], 0, 'Jos 6:25'),
   O('¿De quién nació Jesús?', ['De María', 'De Rut', 'De Rahab'], 0, 'Mt 1:16'),
 ], 'Dios recibe con amor a quien confía en él, venga del pueblo que venga.',
 DEV(['Mt 1:5-6'],
  'En la familia de Jesús hay mujeres que no eran de Israel. Rahab vivía en Jericó y Rut venía de Moab. Las dos confiaron en el Dios verdadero, y Dios las puso en la familia del Salvador (Mt 1:5).',
  'Dios recibe a quien confía en él',
  [('Rahab confió', 'Escondió a los mensajeros y Josué le salvó la vida.', 'Jos 6:25'),
   ('Rut confió', 'Llegó a ser bisabuela del rey David.', 'Rt 4:17'),
   ('Jesús es para todos', 'Dios amó al mundo y dio a su Hijo.', 'Jn 3:16')],
  'Jesús vino a salvar a niños y grandes de todos los pueblos.',
  ['Sé amable con quien viene de otro lugar.', 'Recuerda que Dios te ama y te llama a confiar en Jesús.', 'Ora por niños de otros países.'],
  ('Mt 1:5-6', 'Booz engendró de Rut a Obed'),
  '¿Cómo puedes mostrar el amor de Jesús a alguien que es diferente a ti?')),

 NIVEL('gen-ni-3', 'Desde Adán hasta Jesús', ['Lc 3:38'], [
   O('¿Hasta quién llega la lista de Lucas?', ['Hasta Adán', 'Hasta Moisés', 'Hasta Pedro'], 0, 'Lc 3:38'),
   C('Completa: «hijo de Adán, hijo de ___».', 'Dios', 'Lc 3:38'),
   O('¿Por qué dice Lucas que Jesús era hijo de José «según se creía»?', ['Porque Jesús nació de la virgen María, sin papá humano', 'Porque José era rey', 'Porque no lo conocían'], 0, 'Lc 3:23'),
   R('Ordena de más antiguo a más nuevo.', ['Adán', 'Noé', 'Abraham', 'David', 'Jesús'], 'Lc 3:23-38'),
   O('¿Para quién vino Jesús?', ['Solo para un pueblo', 'Para todos los hijos de Adán', 'Para nadie'], 1, 'Ro 5:19'),
 ], 'Todos venimos de Adán, y Jesús vino a salvar a los que creen en él.',
 DEV(['Lc 3:38'],
  'Lucas escribe la familia de Jesús hacia atrás, desde Jesús hasta Adán, el primer hombre, «hijo de Dios» (Lc 3:38). Así muestra que Jesús vino para todas las personas, porque todos venimos de Adán.',
  'Jesús vino por todos',
  [('El primer hombre', 'Adán fue creado por Dios.', 'Lc 3:38'),
   ('Todos pecamos', 'Por la desobediencia de Adán entró el pecado.', 'Ro 5:12'),
   ('Jesús obedeció', 'Por la obediencia de Jesús, muchos son hechos justos.', 'Ro 5:19')],
  'Jesús es el Salvador para todos los que creen en él.',
  ['Da gracias porque Jesús vino por ti.', 'Cuenta a un amigo que Jesús vino para todos.', 'Pide perdón a Dios cuando desobedezcas.'],
  ('Lc 3:38', 'hijo de Adán, hijo de Dios'),
  'Escribe con tus palabras por qué Lucas llega hasta Adán.')),
]


def validar():
    txt_mt = V['Mt 1:1-17']
    for n in MATEO:
        assert n in txt_mt, f'Nombre de Mateo no está en el texto: {n}'
    for g in GRUPOS_MT:
        assert g['hasta'] - g['desde'] + 1 == 14, g
    assert LUCAS[1] == 'José' and LUCAS[-1] == 'Dios' and LUCAS[-2] == 'Adán', LUCAS[:3]
    for m in MUJERES:
        assert m in txt_mt, m
    for k, (_, cita) in {**NOTAS, **NOTAS_MUJER}.items():
        assert cita in V, f'Nota de {k}: cita sin texto verificado {cita}'
        assert k in txt_mt or k in TXT_LC, f'Nota para nombre que no está en el texto: {k}'
    for _, _, cita in POR_QUE_DIFIEREN:
        assert cita in V, cita
    return {
        'mateo': MATEO, 'grupos_mt': GRUPOS_MT, 'lucas': LUCAS, 'mujeres': MUJERES,
        'notas': {k: {'texto': t, 'cita': c} for k, (t, c) in NOTAS.items()},
        'notas_mujer': {k: {'texto': t, 'cita': c} for k, (t, c) in NOTAS_MUJER.items()},
        'comparar': COMPARAR,
        'por_que': [{'titulo': a, 'texto': b, 'cita': c} for a, b, c in POR_QUE_DIFIEREN],
        'cual': [{'frase': f, 'resp': r} for f, r in CUAL],
        'distractores': MUJ_DISTRACTORES,
        'textos': {'Mt 1:1-17': V['Mt 1:1-17'], 'Lc 3:23-38': V['Lc 3:23-38']},
    }
