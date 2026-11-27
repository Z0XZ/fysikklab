# Laget av et engangsskript fra NIST «Atomic Weights and Isotopic Compositions» (atommasser, forekomst og standard atomvekt)
# og IAEA LiveChart of Nuclides (halveringstid og henfallsmåte), hentet 27.11.2026. Ikke rediger for hånd uten å sjekke mot kildene.
# Atomvekt: IUPAC sin konvensjonelle verdi der NIST oppgir et intervall. Tall i parentes er massetallet til den mest stabile isotopen.
GRUNNSTOFF = [
{
"z": 1,
"sym": "H",
"navn": "hydrogen",
"masse": "1,008",
"stabile": [
[
1,
"99,99"
],
[
2,
"0,0115"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 2,
"sym": "He",
"navn": "helium",
"masse": "4,002602",
"stabile": [
[
3,
"0,00013"
],
[
4,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 3,
"sym": "Li",
"navn": "litium",
"masse": "6,94",
"stabile": [
[
6,
"7,59"
],
[
7,
"92,41"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 4,
"sym": "Be",
"navn": "beryllium",
"masse": "9,0121831",
"stabile": [
[
9,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 5,
"sym": "B",
"navn": "bor",
"masse": "10,81",
"stabile": [
[
10,
"19,9"
],
[
11,
"80,1"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 6,
"sym": "C",
"navn": "karbon",
"masse": "12,011",
"stabile": [
[
12,
"98,93"
],
[
13,
"1,07"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 7,
"sym": "N",
"navn": "nitrogen",
"masse": "14,007",
"stabile": [
[
14,
"99,64"
],
[
15,
"0,364"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 8,
"sym": "O",
"navn": "oksygen",
"masse": "15,999",
"stabile": [
[
16,
"99,76"
],
[
17,
"0,038"
],
[
18,
"0,205"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 9,
"sym": "F",
"navn": "fluor",
"masse": "18,998403163",
"stabile": [
[
19,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 10,
"sym": "Ne",
"navn": "neon",
"masse": "20,1797",
"stabile": [
[
20,
"90,48"
],
[
21,
"0,27"
],
[
22,
"9,25"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 11,
"sym": "Na",
"navn": "natrium",
"masse": "22,98976928",
"stabile": [
[
23,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 12,
"sym": "Mg",
"navn": "magnesium",
"masse": "24,305",
"stabile": [
[
24,
"78,99"
],
[
25,
"10"
],
[
26,
"11,01"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 13,
"sym": "Al",
"navn": "aluminium",
"masse": "26,9815385",
"stabile": [
[
27,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 14,
"sym": "Si",
"navn": "silisium",
"masse": "28,085",
"stabile": [
[
28,
"92,22"
],
[
29,
"4,685"
],
[
30,
"3,092"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 15,
"sym": "P",
"navn": "fosfor",
"masse": "30,973761998",
"stabile": [
[
31,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 16,
"sym": "S",
"navn": "svovel",
"masse": "32,06",
"stabile": [
[
32,
"94,99"
],
[
33,
"0,75"
],
[
34,
"4,25"
],
[
36,
"0,01"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 17,
"sym": "Cl",
"navn": "klor",
"masse": "35,45",
"stabile": [
[
35,
"75,76"
],
[
37,
"24,24"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 18,
"sym": "Ar",
"navn": "argon",
"masse": "39,948",
"stabile": [
[
36,
"0,3336"
],
[
38,
"0,0629"
],
[
40,
"99,6"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 19,
"sym": "K",
"navn": "kalium",
"masse": "39,0983",
"stabile": [
[
39,
"93,26"
],
[
41,
"6,73"
]
],
"lengst": None,
"naturlige": [
[
40,
"0,0117",
"1,25 · 10^{9} år",
"β⁻"
]
]
},
{
"z": 20,
"sym": "Ca",
"navn": "kalsium",
"masse": "40,078",
"stabile": [
[
40,
"96,94"
],
[
42,
"0,647"
],
[
43,
"0,135"
],
[
44,
"2,086"
],
[
46,
"0,004"
]
],
"lengst": None,
"naturlige": [
[
48,
"0,187",
"2,9 · 10^{19} år",
"2β⁻"
]
]
},
{
"z": 21,
"sym": "Sc",
"navn": "scandium",
"masse": "44,955908",
"stabile": [
[
45,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 22,
"sym": "Ti",
"navn": "titan",
"masse": "47,867",
"stabile": [
[
46,
"8,25"
],
[
47,
"7,44"
],
[
48,
"73,72"
],
[
49,
"5,41"
],
[
50,
"5,18"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 23,
"sym": "V",
"navn": "vanadium",
"masse": "50,9415",
"stabile": [
[
51,
"99,75"
]
],
"lengst": None,
"naturlige": [
[
50,
"0,25",
"2,65 · 10^{17} år",
"β⁺/EC"
]
]
},
{
"z": 24,
"sym": "Cr",
"navn": "krom",
"masse": "51,9961",
"stabile": [
[
52,
"83,79"
],
[
53,
"9,501"
],
[
54,
"2,365"
]
],
"lengst": None,
"naturlige": [
[
50,
"4,345",
"1,3 · 10^{18} år",
"2EC"
]
]
},
{
"z": 25,
"sym": "Mn",
"navn": "mangan",
"masse": "54,938044",
"stabile": [
[
55,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 26,
"sym": "Fe",
"navn": "jern",
"masse": "55,845",
"stabile": [
[
54,
"5,845"
],
[
56,
"91,75"
],
[
57,
"2,119"
],
[
58,
"0,282"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 27,
"sym": "Co",
"navn": "kobolt",
"masse": "58,933194",
"stabile": [
[
59,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 28,
"sym": "Ni",
"navn": "nikkel",
"masse": "58,6934",
"stabile": [
[
58,
"68,08"
],
[
60,
"26,22"
],
[
61,
"1,14"
],
[
62,
"3,635"
],
[
64,
"0,9255"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 29,
"sym": "Cu",
"navn": "kobber",
"masse": "63,546",
"stabile": [
[
63,
"69,15"
],
[
65,
"30,85"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 30,
"sym": "Zn",
"navn": "sink",
"masse": "65,38",
"stabile": [
[
64,
"49,17"
],
[
66,
"27,73"
],
[
67,
"4,04"
],
[
68,
"18,45"
]
],
"lengst": None,
"naturlige": [
[
70,
"0,61",
"3,8 · 10^{18} år",
"2β⁻"
]
]
},
{
"z": 31,
"sym": "Ga",
"navn": "gallium",
"masse": "69,723",
"stabile": [
[
69,
"60,11"
],
[
71,
"39,89"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 32,
"sym": "Ge",
"navn": "germanium",
"masse": "72,630",
"stabile": [
[
70,
"20,57"
],
[
72,
"27,45"
],
[
73,
"7,75"
],
[
74,
"36,5"
],
[
76,
"7,73"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 33,
"sym": "As",
"navn": "arsen",
"masse": "74,921595",
"stabile": [
[
75,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 34,
"sym": "Se",
"navn": "selen",
"masse": "78,971",
"stabile": [
[
74,
"0,89"
],
[
76,
"9,37"
],
[
77,
"7,63"
],
[
78,
"23,77"
],
[
80,
"49,61"
]
],
"lengst": None,
"naturlige": [
[
82,
"8,73",
"9,6 · 10^{19} år",
"2β⁻"
]
]
},
{
"z": 35,
"sym": "Br",
"navn": "brom",
"masse": "79,904",
"stabile": [
[
79,
"50,69"
],
[
81,
"49,31"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 36,
"sym": "Kr",
"navn": "krypton",
"masse": "83,798",
"stabile": [
[
78,
"0,355"
],
[
80,
"2,286"
],
[
82,
"11,59"
],
[
83,
"11,5"
],
[
84,
"56,99"
],
[
86,
"17,28"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 37,
"sym": "Rb",
"navn": "rubidium",
"masse": "85,4678",
"stabile": [
[
85,
"72,17"
]
],
"lengst": None,
"naturlige": [
[
87,
"27,83",
"4,97 · 10^{10} år",
"β⁻"
]
]
},
{
"z": 38,
"sym": "Sr",
"navn": "strontium",
"masse": "87,62",
"stabile": [
[
84,
"0,56"
],
[
86,
"9,86"
],
[
87,
"7"
],
[
88,
"82,58"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 39,
"sym": "Y",
"navn": "yttrium",
"masse": "88,90584",
"stabile": [
[
89,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 40,
"sym": "Zr",
"navn": "zirkonium",
"masse": "91,224",
"stabile": [
[
90,
"51,45"
],
[
91,
"11,22"
],
[
92,
"17,15"
],
[
94,
"17,38"
]
],
"lengst": None,
"naturlige": [
[
96,
"2,8",
"2 · 10^{19} år",
""
]
]
},
{
"z": 41,
"sym": "Nb",
"navn": "niob",
"masse": "92,90637",
"stabile": [
[
93,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 42,
"sym": "Mo",
"navn": "molybden",
"masse": "95,95",
"stabile": [
[
92,
"14,53"
],
[
94,
"9,15"
],
[
95,
"15,84"
],
[
96,
"16,67"
],
[
97,
"9,6"
],
[
98,
"24,39"
]
],
"lengst": None,
"naturlige": [
[
100,
"9,82",
"7,01 · 10^{18} år",
"2β⁻"
]
]
},
{
"z": 43,
"sym": "Tc",
"navn": "technetium",
"masse": "(98)",
"stabile": [],
"lengst": [
97,
"4,21 · 10^{6} år",
"EC"
],
"naturlige": []
},
{
"z": 44,
"sym": "Ru",
"navn": "ruthenium",
"masse": "101,07",
"stabile": [
[
96,
"5,54"
],
[
98,
"1,87"
],
[
99,
"12,76"
],
[
100,
"12,6"
],
[
101,
"17,06"
],
[
102,
"31,55"
],
[
104,
"18,62"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 45,
"sym": "Rh",
"navn": "rhodium",
"masse": "102,90550",
"stabile": [
[
103,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 46,
"sym": "Pd",
"navn": "palladium",
"masse": "106,42",
"stabile": [
[
102,
"1,02"
],
[
104,
"11,14"
],
[
105,
"22,33"
],
[
106,
"27,33"
],
[
108,
"26,46"
],
[
110,
"11,72"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 47,
"sym": "Ag",
"navn": "sølv",
"masse": "107,8682",
"stabile": [
[
107,
"51,84"
],
[
109,
"48,16"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 48,
"sym": "Cd",
"navn": "kadmium",
"masse": "112,414",
"stabile": [
[
106,
"1,25"
],
[
108,
"0,89"
],
[
110,
"12,49"
],
[
111,
"12,8"
],
[
112,
"24,13"
],
[
114,
"28,73"
]
],
"lengst": None,
"naturlige": [
[
113,
"12,22",
"8,04 · 10^{15} år",
"β⁻"
],
[
116,
"7,49",
"3,3 · 10^{19} år",
"2β⁻"
]
]
},
{
"z": 49,
"sym": "In",
"navn": "indium",
"masse": "114,818",
"stabile": [
[
113,
"4,29"
]
],
"lengst": None,
"naturlige": [
[
115,
"95,71",
"4,41 · 10^{14} år",
"β⁻"
]
]
},
{
"z": 50,
"sym": "Sn",
"navn": "tinn",
"masse": "118,710",
"stabile": [
[
112,
"0,97"
],
[
114,
"0,66"
],
[
115,
"0,34"
],
[
116,
"14,54"
],
[
117,
"7,68"
],
[
118,
"24,22"
],
[
119,
"8,59"
],
[
120,
"32,58"
],
[
122,
"4,63"
],
[
124,
"5,79"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 51,
"sym": "Sb",
"navn": "antimon",
"masse": "121,760",
"stabile": [
[
121,
"57,21"
],
[
123,
"42,79"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 52,
"sym": "Te",
"navn": "tellur",
"masse": "127,60",
"stabile": [
[
120,
"0,09"
],
[
122,
"2,55"
],
[
124,
"4,74"
],
[
125,
"7,07"
],
[
126,
"18,84"
]
],
"lengst": None,
"naturlige": [
[
123,
"0,89",
"9,2 · 10^{16} år",
"EC"
],
[
128,
"31,74",
"7,7 · 10^{24} år",
"2β⁻"
],
[
130,
"34,08",
"7,9 · 10^{20} år",
"2β⁻"
]
]
},
{
"z": 53,
"sym": "I",
"navn": "jod",
"masse": "126,90447",
"stabile": [
[
127,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 54,
"sym": "Xe",
"navn": "xenon",
"masse": "131,293",
"stabile": [
[
126,
"0,089"
],
[
128,
"1,91"
],
[
129,
"26,4"
],
[
130,
"4,071"
],
[
131,
"21,23"
],
[
132,
"26,91"
]
],
"lengst": None,
"naturlige": [
[
124,
"0,0952",
"1,6 · 10^{14} år",
"2B+"
],
[
134,
"10,44",
"5,8 · 10^{22} år",
"2β⁻"
],
[
136,
"8,857",
"2,16 · 10^{21} år",
"2β⁻"
]
]
},
{
"z": 55,
"sym": "Cs",
"navn": "cesium",
"masse": "132,90545196",
"stabile": [
[
133,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 56,
"sym": "Ba",
"navn": "barium",
"masse": "137,327",
"stabile": [
[
130,
"0,106"
],
[
134,
"2,417"
],
[
135,
"6,592"
],
[
136,
"7,854"
],
[
137,
"11,23"
],
[
138,
"71,7"
]
],
"lengst": None,
"naturlige": [
[
132,
"0,101",
"3 · 10^{21} år",
"2B+"
]
]
},
{
"z": 57,
"sym": "La",
"navn": "lantan",
"masse": "138,90547",
"stabile": [
[
139,
"99,91"
]
],
"lengst": None,
"naturlige": [
[
138,
"0,08881",
"1,03 · 10^{11} år",
"β⁺/EC"
]
]
},
{
"z": 58,
"sym": "Ce",
"navn": "cerium",
"masse": "140,116",
"stabile": [
[
136,
"0,185"
],
[
140,
"88,45"
]
],
"lengst": None,
"naturlige": [
[
138,
"0,251",
"4,4 · 10^{16} år",
"2EC"
],
[
142,
"11,11",
"5 · 10^{16} år",
""
]
]
},
{
"z": 59,
"sym": "Pr",
"navn": "praseodym",
"masse": "140,90766",
"stabile": [
[
141,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 60,
"sym": "Nd",
"navn": "neodym",
"masse": "144,242",
"stabile": [
[
142,
"27,15"
],
[
143,
"12,17"
],
[
145,
"8,293"
],
[
146,
"17,19"
],
[
148,
"5,756"
]
],
"lengst": None,
"naturlige": [
[
144,
"23,8",
"2,29 · 10^{15} år",
"α"
],
[
150,
"5,638",
"9,1 · 10^{18} år",
"2β⁻"
]
]
},
{
"z": 61,
"sym": "Pm",
"navn": "prometium",
"masse": "(145)",
"stabile": [],
"lengst": [
145,
"17,7 år",
"EC"
],
"naturlige": []
},
{
"z": 62,
"sym": "Sm",
"navn": "samarium",
"masse": "150,36",
"stabile": [
[
144,
"3,07"
],
[
149,
"13,82"
],
[
150,
"7,38"
],
[
152,
"26,75"
],
[
154,
"22,75"
]
],
"lengst": None,
"naturlige": [
[
147,
"14,99",
"1,07 · 10^{11} år",
"α"
],
[
148,
"11,24",
"7 · 10^{15} år",
"α"
]
]
},
{
"z": 63,
"sym": "Eu",
"navn": "europium",
"masse": "151,964",
"stabile": [
[
153,
"52,19"
]
],
"lengst": None,
"naturlige": [
[
151,
"47,81",
"1,7 · 10^{18} år",
"α"
]
]
},
{
"z": 64,
"sym": "Gd",
"navn": "gadolinium",
"masse": "157,25",
"stabile": [
[
154,
"2,18"
],
[
155,
"14,8"
],
[
156,
"20,47"
],
[
157,
"15,65"
],
[
158,
"24,84"
],
[
160,
"21,86"
]
],
"lengst": None,
"naturlige": [
[
152,
"0,2",
"1,08 · 10^{14} år",
"α"
]
]
},
{
"z": 65,
"sym": "Tb",
"navn": "terbium",
"masse": "158,92535",
"stabile": [
[
159,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 66,
"sym": "Dy",
"navn": "dysprosium",
"masse": "162,500",
"stabile": [
[
156,
"0,056"
],
[
158,
"0,095"
],
[
160,
"2,329"
],
[
161,
"18,89"
],
[
162,
"25,47"
],
[
163,
"24,9"
],
[
164,
"28,26"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 67,
"sym": "Ho",
"navn": "holmium",
"masse": "164,93033",
"stabile": [
[
165,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 68,
"sym": "Er",
"navn": "erbium",
"masse": "167,259",
"stabile": [
[
162,
"0,139"
],
[
164,
"1,601"
],
[
166,
"33,5"
],
[
167,
"22,87"
],
[
168,
"26,98"
],
[
170,
"14,91"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 69,
"sym": "Tm",
"navn": "thulium",
"masse": "168,93422",
"stabile": [
[
169,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 70,
"sym": "Yb",
"navn": "ytterbium",
"masse": "173,054",
"stabile": [
[
168,
"0,123"
],
[
170,
"2,982"
],
[
171,
"14,09"
],
[
172,
"21,68"
],
[
173,
"16,1"
],
[
174,
"32,03"
],
[
176,
"13"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 71,
"sym": "Lu",
"navn": "lutetium",
"masse": "174,9668",
"stabile": [
[
175,
"97,4"
]
],
"lengst": None,
"naturlige": [
[
176,
"2,599",
"3,76 · 10^{10} år",
"β⁻"
]
]
},
{
"z": 72,
"sym": "Hf",
"navn": "hafnium",
"masse": "178,49",
"stabile": [
[
176,
"5,26"
],
[
177,
"18,6"
],
[
178,
"27,28"
],
[
179,
"13,62"
],
[
180,
"35,08"
]
],
"lengst": None,
"naturlige": [
[
174,
"0,16",
"2 · 10^{15} år",
"α"
]
]
},
{
"z": 73,
"sym": "Ta",
"navn": "tantal",
"masse": "180,94788",
"stabile": [
[
181,
"99,99"
]
],
"lengst": None,
"naturlige": [
[
180,
"0,01201",
"8,154 h",
"EC"
]
]
},
{
"z": 74,
"sym": "W",
"navn": "wolfram",
"masse": "183,84",
"stabile": [
[
182,
"26,5"
],
[
184,
"30,64"
],
[
186,
"28,43"
]
],
"lengst": None,
"naturlige": [
[
180,
"0,12",
"1,8 · 10^{18} år",
"α"
],
[
183,
"14,31",
"6,7 · 10^{20} år",
"α"
]
]
},
{
"z": 75,
"sym": "Re",
"navn": "rhenium",
"masse": "186,207",
"stabile": [
[
185,
"37,4"
]
],
"lengst": None,
"naturlige": [
[
187,
"62,6",
"4,33 · 10^{10} år",
"β⁻"
]
]
},
{
"z": 76,
"sym": "Os",
"navn": "osmium",
"masse": "190,23",
"stabile": [
[
187,
"1,96"
],
[
188,
"13,24"
],
[
189,
"16,15"
],
[
190,
"26,26"
],
[
192,
"40,78"
]
],
"lengst": None,
"naturlige": [
[
184,
"0,02",
"5,6 · 10^{13} år",
"2B+"
],
[
186,
"1,59",
"2 · 10^{15} år",
"α"
]
]
},
{
"z": 77,
"sym": "Ir",
"navn": "iridium",
"masse": "192,217",
"stabile": [
[
191,
"37,3"
],
[
193,
"62,7"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 78,
"sym": "Pt",
"navn": "platina",
"masse": "195,084",
"stabile": [
[
192,
"0,782"
],
[
194,
"32,86"
],
[
195,
"33,78"
],
[
196,
"25,21"
],
[
198,
"7,356"
]
],
"lengst": None,
"naturlige": [
[
190,
"0,012",
"4,97 · 10^{11} år",
"α"
]
]
},
{
"z": 79,
"sym": "Au",
"navn": "gull",
"masse": "196,966569",
"stabile": [
[
197,
"100"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 80,
"sym": "Hg",
"navn": "kvikksølv",
"masse": "200,592",
"stabile": [
[
196,
"0,15"
],
[
198,
"9,97"
],
[
199,
"16,87"
],
[
200,
"23,1"
],
[
201,
"13,18"
],
[
202,
"29,86"
],
[
204,
"6,87"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 81,
"sym": "Tl",
"navn": "thallium",
"masse": "204,38",
"stabile": [
[
203,
"29,52"
],
[
205,
"70,48"
]
],
"lengst": None,
"naturlige": []
},
{
"z": 82,
"sym": "Pb",
"navn": "bly",
"masse": "207,2",
"stabile": [
[
206,
"24,1"
],
[
207,
"22,1"
],
[
208,
"52,4"
]
],
"lengst": None,
"naturlige": [
[
204,
"1,4",
"1,4 · 10^{17} år",
"α"
]
]
},
{
"z": 83,
"sym": "Bi",
"navn": "vismut",
"masse": "208,98040",
"stabile": [],
"lengst": [
209,
"2,01 · 10^{19} år",
"α"
],
"naturlige": [
[
209,
"100",
"2,01 · 10^{19} år",
"α"
]
]
},
{
"z": 84,
"sym": "Po",
"navn": "polonium",
"masse": "(209)",
"stabile": [],
"lengst": [
209,
"124 år",
"α"
],
"naturlige": []
},
{
"z": 85,
"sym": "At",
"navn": "astat",
"masse": "(210)",
"stabile": [],
"lengst": [
210,
"8,1 h",
"β⁺/EC"
],
"naturlige": []
},
{
"z": 86,
"sym": "Rn",
"navn": "radon",
"masse": "(222)",
"stabile": [],
"lengst": [
222,
"3,824 døgn",
"α"
],
"naturlige": []
},
{
"z": 87,
"sym": "Fr",
"navn": "francium",
"masse": "(223)",
"stabile": [],
"lengst": [
223,
"22 min",
"β⁻"
],
"naturlige": []
},
{
"z": 88,
"sym": "Ra",
"navn": "radium",
"masse": "(226)",
"stabile": [],
"lengst": [
226,
"1 600 år",
"α"
],
"naturlige": []
},
{
"z": 89,
"sym": "Ac",
"navn": "actinium",
"masse": "(227)",
"stabile": [],
"lengst": [
227,
"21,77 år",
"β⁻"
],
"naturlige": []
},
{
"z": 90,
"sym": "Th",
"navn": "thorium",
"masse": "232,0377",
"stabile": [],
"lengst": [
232,
"1,4 · 10^{10} år",
"α"
],
"naturlige": [
[
232,
"100",
"1,4 · 10^{10} år",
"α"
]
]
},
{
"z": 91,
"sym": "Pa",
"navn": "protactinium",
"masse": "231,03588",
"stabile": [],
"lengst": [
231,
"32 570 år",
"α"
],
"naturlige": [
[
231,
"100",
"32 570 år",
"α"
]
]
},
{
"z": 92,
"sym": "U",
"navn": "uran",
"masse": "238,02891",
"stabile": [],
"lengst": [
238,
"4,47 · 10^{9} år",
"α"
],
"naturlige": [
[
234,
"0,0054",
"2,45 · 10^{5} år",
"α"
],
[
235,
"0,7204",
"7,04 · 10^{8} år",
"α"
],
[
238,
"99,27",
"4,47 · 10^{9} år",
"α"
]
]
},
{
"z": 93,
"sym": "Np",
"navn": "neptunium",
"masse": "(237)",
"stabile": [],
"lengst": [
237,
"2,14 · 10^{6} år",
"α"
],
"naturlige": []
},
{
"z": 94,
"sym": "Pu",
"navn": "plutonium",
"masse": "(244)",
"stabile": [],
"lengst": [
244,
"8,13 · 10^{7} år",
"α"
],
"naturlige": []
},
{
"z": 95,
"sym": "Am",
"navn": "americium",
"masse": "(243)",
"stabile": [],
"lengst": [
243,
"7 364 år",
"α"
],
"naturlige": []
},
{
"z": 96,
"sym": "Cm",
"navn": "curium",
"masse": "(247)",
"stabile": [],
"lengst": [
247,
"1,56 · 10^{7} år",
"α"
],
"naturlige": []
},
{
"z": 97,
"sym": "Bk",
"navn": "berkelium",
"masse": "(247)",
"stabile": [],
"lengst": [
247,
"1 380 år",
"α"
],
"naturlige": []
},
{
"z": 98,
"sym": "Cf",
"navn": "californium",
"masse": "(251)",
"stabile": [],
"lengst": [
251,
"898 år",
"α"
],
"naturlige": []
},
{
"z": 99,
"sym": "Es",
"navn": "einsteinium",
"masse": "(252)",
"stabile": [],
"lengst": [
252,
"1,291 år",
"α"
],
"naturlige": []
},
{
"z": 100,
"sym": "Fm",
"navn": "fermium",
"masse": "(257)",
"stabile": [],
"lengst": [
257,
"100,5 døgn",
"α"
],
"naturlige": []
},
{
"z": 101,
"sym": "Md",
"navn": "mendelevium",
"masse": "(258)",
"stabile": [],
"lengst": [
258,
"51,5 døgn",
"α"
],
"naturlige": []
},
{
"z": 102,
"sym": "No",
"navn": "nobelium",
"masse": "(259)",
"stabile": [],
"lengst": [
259,
"58 min",
"α"
],
"naturlige": []
},
{
"z": 103,
"sym": "Lr",
"navn": "lawrencium",
"masse": "(266)",
"stabile": [],
"lengst": [
266,
"11 h",
"fisjon"
],
"naturlige": []
},
{
"z": 104,
"sym": "Rf",
"navn": "rutherfordium",
"masse": "(267)",
"stabile": [],
"lengst": [
267,
"1,3 h",
"fisjon"
],
"naturlige": []
},
{
"z": 105,
"sym": "Db",
"navn": "dubnium",
"masse": "(268)",
"stabile": [],
"lengst": [
268,
"1,167 døgn",
"fisjon"
],
"naturlige": []
},
{
"z": 106,
"sym": "Sg",
"navn": "seaborgium",
"masse": "(269)",
"stabile": [],
"lengst": [
269,
"2,167 min",
"α"
],
"naturlige": []
},
{
"z": 107,
"sym": "Bh",
"navn": "bohrium",
"masse": "(278)",
"stabile": [],
"lengst": [
278,
"19 min",
"fisjon"
],
"naturlige": []
},
{
"z": 108,
"sym": "Hs",
"navn": "hassium",
"masse": "(278)",
"stabile": [],
"lengst": [
278,
"19 min",
"fisjon"
],
"naturlige": []
},
{
"z": 109,
"sym": "Mt",
"navn": "meitnerium",
"masse": "(282)",
"stabile": [],
"lengst": [
282,
"1,1 min",
"α"
],
"naturlige": []
},
{
"z": 110,
"sym": "Ds",
"navn": "darmstadtium",
"masse": "(282)",
"stabile": [],
"lengst": [
282,
"1,1 min",
"α"
],
"naturlige": []
},
{
"z": 111,
"sym": "Rg",
"navn": "røntgenium",
"masse": "(286)",
"stabile": [],
"lengst": [
286,
"11 min",
"α"
],
"naturlige": []
},
{
"z": 112,
"sym": "Cn",
"navn": "kopernikium",
"masse": "(286)",
"stabile": [],
"lengst": [
286,
"11 min",
"α"
],
"naturlige": []
},
{
"z": 113,
"sym": "Nh",
"navn": "nihonium",
"masse": "(286)",
"stabile": [],
"lengst": [
286,
"9,5 s",
"α"
],
"naturlige": []
},
{
"z": 114,
"sym": "Fl",
"navn": "flerovium",
"masse": "(290)",
"stabile": [],
"lengst": [
290,
"19 s",
"β⁺/EC"
],
"naturlige": []
},
{
"z": 115,
"sym": "Mc",
"navn": "moscovium",
"masse": "(290)",
"stabile": [],
"lengst": [
290,
"650 ms",
"α"
],
"naturlige": []
},
{
"z": 116,
"sym": "Lv",
"navn": "livermorium",
"masse": "(293)",
"stabile": [],
"lengst": [
293,
"95 ms",
"α"
],
"naturlige": []
},
{
"z": 117,
"sym": "Ts",
"navn": "tennes",
"masse": "(294)",
"stabile": [],
"lengst": [
294,
"51 ms",
"α"
],
"naturlige": []
},
{
"z": 118,
"sym": "Og",
"navn": "oganesson",
"masse": "(294)",
"stabile": [],
"lengst": [
294,
"0,58 ms",
"α"
],
"naturlige": []
}
]
NUKLIDER = [
{
"z": 0,
"a": 1,
"sym": "n",
"masse": "1,008665",
"halv": "10,23 min",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 1,
"a": 1,
"sym": "H",
"masse": "1,007825",
"halv": "stabil",
"henfall": "",
"forekomst": "99,99 %"
},
{
"z": 1,
"a": 2,
"sym": "H",
"masse": "2,014102",
"halv": "stabil",
"henfall": "",
"forekomst": "0,0115 %"
},
{
"z": 1,
"a": 3,
"sym": "H",
"masse": "3,016049",
"halv": "12,32 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 2,
"a": 3,
"sym": "He",
"masse": "3,016029",
"halv": "stabil",
"henfall": "",
"forekomst": "0,00013 %"
},
{
"z": 2,
"a": 4,
"sym": "He",
"masse": "4,002603",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 3,
"a": 6,
"sym": "Li",
"masse": "6,015123",
"halv": "stabil",
"henfall": "",
"forekomst": "7,59 %"
},
{
"z": 3,
"a": 7,
"sym": "Li",
"masse": "7,016003",
"halv": "stabil",
"henfall": "",
"forekomst": "92,41 %"
},
{
"z": 4,
"a": 7,
"sym": "Be",
"masse": "7,016929",
"halv": "53,22 døgn",
"henfall": "EC",
"forekomst": ""
},
{
"z": 4,
"a": 9,
"sym": "Be",
"masse": "9,012183",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 5,
"a": 10,
"sym": "B",
"masse": "10,012937",
"halv": "stabil",
"henfall": "",
"forekomst": "19,9 %"
},
{
"z": 5,
"a": 11,
"sym": "B",
"masse": "11,009305",
"halv": "stabil",
"henfall": "",
"forekomst": "80,1 %"
},
{
"z": 6,
"a": 11,
"sym": "C",
"masse": "11,011434",
"halv": "20,36 min",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 6,
"a": 12,
"sym": "C",
"masse": "12,000000",
"halv": "stabil",
"henfall": "",
"forekomst": "98,93 %"
},
{
"z": 6,
"a": 13,
"sym": "C",
"masse": "13,003355",
"halv": "stabil",
"henfall": "",
"forekomst": "1,07 %"
},
{
"z": 6,
"a": 14,
"sym": "C",
"masse": "14,003242",
"halv": "5 700 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 7,
"a": 13,
"sym": "N",
"masse": "13,005739",
"halv": "9,965 min",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 7,
"a": 14,
"sym": "N",
"masse": "14,003074",
"halv": "stabil",
"henfall": "",
"forekomst": "99,64 %"
},
{
"z": 7,
"a": 15,
"sym": "N",
"masse": "15,000109",
"halv": "stabil",
"henfall": "",
"forekomst": "0,364 %"
},
{
"z": 8,
"a": 15,
"sym": "O",
"masse": "15,003066",
"halv": "2,037 min",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 8,
"a": 16,
"sym": "O",
"masse": "15,994915",
"halv": "stabil",
"henfall": "",
"forekomst": "99,76 %"
},
{
"z": 8,
"a": 17,
"sym": "O",
"masse": "16,999132",
"halv": "stabil",
"henfall": "",
"forekomst": "0,038 %"
},
{
"z": 8,
"a": 18,
"sym": "O",
"masse": "17,999160",
"halv": "stabil",
"henfall": "",
"forekomst": "0,205 %"
},
{
"z": 9,
"a": 18,
"sym": "F",
"masse": "18,000937",
"halv": "1,829 h",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 9,
"a": 19,
"sym": "F",
"masse": "18,998403",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 10,
"a": 20,
"sym": "Ne",
"masse": "19,992440",
"halv": "stabil",
"henfall": "",
"forekomst": "90,48 %"
},
{
"z": 11,
"a": 22,
"sym": "Na",
"masse": "21,994437",
"halv": "2,602 år",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 11,
"a": 23,
"sym": "Na",
"masse": "22,989769",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 11,
"a": 24,
"sym": "Na",
"masse": "23,990963",
"halv": "14,96 h",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 12,
"a": 24,
"sym": "Mg",
"masse": "23,985042",
"halv": "stabil",
"henfall": "",
"forekomst": "78,99 %"
},
{
"z": 13,
"a": 27,
"sym": "Al",
"masse": "26,981539",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 14,
"a": 28,
"sym": "Si",
"masse": "27,976927",
"halv": "stabil",
"henfall": "",
"forekomst": "92,22 %"
},
{
"z": 15,
"a": 30,
"sym": "P",
"masse": "29,978314",
"halv": "2,498 min",
"henfall": "β⁺/EC",
"forekomst": ""
},
{
"z": 15,
"a": 31,
"sym": "P",
"masse": "30,973762",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 15,
"a": 32,
"sym": "P",
"masse": "31,973908",
"halv": "14,27 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 16,
"a": 32,
"sym": "S",
"masse": "31,972071",
"halv": "stabil",
"henfall": "",
"forekomst": "94,99 %"
},
{
"z": 17,
"a": 35,
"sym": "Cl",
"masse": "34,968853",
"halv": "stabil",
"henfall": "",
"forekomst": "75,76 %"
},
{
"z": 18,
"a": 40,
"sym": "Ar",
"masse": "39,962383",
"halv": "stabil",
"henfall": "",
"forekomst": "99,6 %"
},
{
"z": 19,
"a": 39,
"sym": "K",
"masse": "38,963706",
"halv": "stabil",
"henfall": "",
"forekomst": "93,26 %"
},
{
"z": 19,
"a": 40,
"sym": "K",
"masse": "39,963998",
"halv": "1,25 · 10^{9} år",
"henfall": "β⁻",
"forekomst": "0,0117 %"
},
{
"z": 20,
"a": 40,
"sym": "Ca",
"masse": "39,962591",
"halv": "stabil",
"henfall": "",
"forekomst": "96,94 %"
},
{
"z": 26,
"a": 56,
"sym": "Fe",
"masse": "55,934936",
"halv": "stabil",
"henfall": "",
"forekomst": "91,75 %"
},
{
"z": 27,
"a": 59,
"sym": "Co",
"masse": "58,933194",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 27,
"a": 60,
"sym": "Co",
"masse": "59,933816",
"halv": "5,271 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 28,
"a": 58,
"sym": "Ni",
"masse": "57,935342",
"halv": "stabil",
"henfall": "",
"forekomst": "68,08 %"
},
{
"z": 28,
"a": 62,
"sym": "Ni",
"masse": "61,928345",
"halv": "stabil",
"henfall": "",
"forekomst": "3,635 %"
},
{
"z": 29,
"a": 63,
"sym": "Cu",
"masse": "62,929598",
"halv": "stabil",
"henfall": "",
"forekomst": "69,15 %"
},
{
"z": 36,
"a": 89,
"sym": "Kr",
"masse": "88,917835",
"halv": "3,15 min",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 36,
"a": 92,
"sym": "Kr",
"masse": "91,926173",
"halv": "1,84 s",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 38,
"a": 90,
"sym": "Sr",
"masse": "89,907730",
"halv": "28,91 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 38,
"a": 94,
"sym": "Sr",
"masse": "93,915356",
"halv": "1,255 min",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 39,
"a": 90,
"sym": "Y",
"masse": "89,907144",
"halv": "2,669 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 43,
"a": 99,
"sym": "Tc",
"masse": "98,906251",
"halv": "2,11 · 10^{5} år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 53,
"a": 127,
"sym": "I",
"masse": "126,904472",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 53,
"a": 131,
"sym": "I",
"masse": "130,906126",
"halv": "8,025 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 54,
"a": 131,
"sym": "Xe",
"masse": "130,905084",
"halv": "stabil",
"henfall": "",
"forekomst": "21,23 %"
},
{
"z": 54,
"a": 140,
"sym": "Xe",
"masse": "139,921646",
"halv": "13,6 s",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 55,
"a": 133,
"sym": "Cs",
"masse": "132,905452",
"halv": "stabil",
"henfall": "",
"forekomst": "100 %"
},
{
"z": 55,
"a": 137,
"sym": "Cs",
"masse": "136,907089",
"halv": "30,08 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 56,
"a": 137,
"sym": "Ba",
"masse": "136,905827",
"halv": "stabil",
"henfall": "",
"forekomst": "11,23 %"
},
{
"z": 56,
"a": 141,
"sym": "Ba",
"masse": "140,914403",
"halv": "18,27 min",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 56,
"a": 144,
"sym": "Ba",
"masse": "143,922955",
"halv": "11,5 s",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 82,
"a": 206,
"sym": "Pb",
"masse": "205,974466",
"halv": "stabil",
"henfall": "",
"forekomst": "24,1 %"
},
{
"z": 82,
"a": 207,
"sym": "Pb",
"masse": "206,975897",
"halv": "stabil",
"henfall": "",
"forekomst": "22,1 %"
},
{
"z": 82,
"a": 208,
"sym": "Pb",
"masse": "207,976653",
"halv": "stabil",
"henfall": "",
"forekomst": "52,4 %"
},
{
"z": 82,
"a": 210,
"sym": "Pb",
"masse": "209,984189",
"halv": "22,2 år",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 83,
"a": 209,
"sym": "Bi",
"masse": "208,980399",
"halv": "2,01 · 10^{19} år",
"henfall": "α",
"forekomst": "100 %"
},
{
"z": 83,
"a": 210,
"sym": "Bi",
"masse": "209,984121",
"halv": "5,012 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 84,
"a": 210,
"sym": "Po",
"masse": "209,982874",
"halv": "138,4 døgn",
"henfall": "α",
"forekomst": ""
},
{
"z": 84,
"a": 214,
"sym": "Po",
"masse": "213,995202",
"halv": "0,1635 ms",
"henfall": "α",
"forekomst": ""
},
{
"z": 84,
"a": 218,
"sym": "Po",
"masse": "218,008973",
"halv": "3,097 min",
"henfall": "α",
"forekomst": ""
},
{
"z": 86,
"a": 220,
"sym": "Rn",
"masse": "220,011394",
"halv": "55,6 s",
"henfall": "α",
"forekomst": ""
},
{
"z": 86,
"a": 222,
"sym": "Rn",
"masse": "222,017578",
"halv": "3,824 døgn",
"henfall": "α",
"forekomst": ""
},
{
"z": 88,
"a": 226,
"sym": "Ra",
"masse": "226,025410",
"halv": "1 600 år",
"henfall": "α",
"forekomst": ""
},
{
"z": 90,
"a": 232,
"sym": "Th",
"masse": "232,038056",
"halv": "1,4 · 10^{10} år",
"henfall": "α",
"forekomst": "100 %"
},
{
"z": 90,
"a": 234,
"sym": "Th",
"masse": "234,043601",
"halv": "24,1 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 92,
"a": 233,
"sym": "U",
"masse": "233,039636",
"halv": "1,59 · 10^{5} år",
"henfall": "α",
"forekomst": ""
},
{
"z": 92,
"a": 234,
"sym": "U",
"masse": "234,040952",
"halv": "2,45 · 10^{5} år",
"henfall": "α",
"forekomst": "0,0054 %"
},
{
"z": 92,
"a": 235,
"sym": "U",
"masse": "235,043930",
"halv": "7,04 · 10^{8} år",
"henfall": "α",
"forekomst": "0,7204 %"
},
{
"z": 92,
"a": 236,
"sym": "U",
"masse": "236,045568",
"halv": "2,34 · 10^{7} år",
"henfall": "α",
"forekomst": ""
},
{
"z": 92,
"a": 238,
"sym": "U",
"masse": "238,050788",
"halv": "4,47 · 10^{9} år",
"henfall": "α",
"forekomst": "99,27 %"
},
{
"z": 92,
"a": 239,
"sym": "U",
"masse": "239,054293",
"halv": "23,45 min",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 93,
"a": 239,
"sym": "Np",
"masse": "239,052939",
"halv": "2,356 døgn",
"henfall": "β⁻",
"forekomst": ""
},
{
"z": 94,
"a": 239,
"sym": "Pu",
"masse": "239,052164",
"halv": "24 110 år",
"henfall": "α",
"forekomst": ""
},
{
"z": 94,
"a": 240,
"sym": "Pu",
"masse": "240,053814",
"halv": "6 561 år",
"henfall": "α",
"forekomst": ""
},
{
"z": 95,
"a": 241,
"sym": "Am",
"masse": "241,056829",
"halv": "432,6 år",
"henfall": "α",
"forekomst": ""
}
]
