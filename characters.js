// Datos de personajes según la especificación
const CHARACTERS = [
    { id: 1, name: "Mujer Baja", height: "Short", hair: "Brown", shirt: "Blue", pants: "Shorts", accessory: "Hat", prop: "Bag", pose: "Standing", mood: "Nervous", colorAccent: "Red" },
    { id: 2, name: "Hombre Alto", height: "Tall", hair: "Brown", shirt: "Blue", pants: "Pants", accessory: "Glasses", prop: "Book", pose: "Sitting", mood: "Confident", colorAccent: "Blue" },
    { id: 3, name: "Mujer Mayor", height: "Medium", hair: "Gray", shirt: "Green", pants: "Skirt", accessory: "Scarf", prop: "Doll", pose: "Leaning", mood: "Calm", colorAccent: "Purple" },
    { id: 4, name: "Hombre Joven", height: "Tall", hair: "Black", shirt: "Red", pants: "Shorts", accessory: "Gloves", prop: "Tennis Racket", pose: "Standing", mood: "Smug", colorAccent: "Orange" },
    { id: 5, name: "Niña con Coletas", height: "Short", hair: "Blonde", shirt: "Pink", pants: "Skirt", accessory: "Hat", prop: "Backpack", pose: "Sitting", mood: "Happy", colorAccent: "Yellow" },
    { id: 6, name: "Hombre de Mediana Edad", height: "Medium", hair: "Brown", shirt: "Blue", pants: "Pants", accessory: "Glasses", prop: "Book", pose: "Standing", mood: "Confident", colorAccent: "Green" },
    { id: 7, name: "Mujer con Trenzas", height: "Medium", hair: "Black", shirt: "Yellow", pants: "Pants", accessory: "None", prop: "Doll", pose: "Leaning", mood: "Nervous", colorAccent: "Orange" },
    { id: 8, name: "Adolescente", height: "Short", hair: "Brown", shirt: "Red", pants: "Shorts", accessory: "Cap", prop: "Skateboard", pose: "Sitting", mood: "Smug", colorAccent: "Red" },
    { id: 9, name: "Mujer Joven", height: "Medium", hair: "Brown", shirt: "Blue", pants: "Jeans", accessory: "Gloves", prop: "Bag", pose: "Standing", mood: "Happy", colorAccent: "Blue" },
    { id: 10, name: "Hombre con Barba", height: "Tall", hair: "Black", shirt: "Green", pants: "Pants", accessory: "Hat", prop: "Book", pose: "Standing", mood: "Confident", colorAccent: "Brown" },
    { id: 11, name: "Niña Pequeña", height: "Short", hair: "Blonde", shirt: "Yellow", pants: "Skirt", accessory: "Hat", prop: "Doll", pose: "Sitting", mood: "Nervous", colorAccent: "Purple" },
    { id: 12, name: "Adolescente", height: "Medium", hair: "Black", shirt: "Red", pants: "Pants", accessory: "None", prop: "Headphones", pose: "Leaning", mood: "Smug", colorAccent: "Red" },
    { id: 13, name: "Hombre Mayor", height: "Short", hair: "Gray", shirt: "Blue", pants: "Shorts", accessory: "Glasses", prop: "Cane", pose: "Standing", mood: "Calm", colorAccent: "Green" },
    { id: 14, name: "Mujer, Cabello Largo", height: "Tall", hair: "Brown", shirt: "Green", pants: "Pants", accessory: "Gloves", prop: "Bag", pose: "Leaning", mood: "Happy", colorAccent: "Orange" },
    { id: 15, name: "Niño con Sudadera", height: "Medium", hair: "Black", shirt: "Blue", pants: "Shorts", accessory: "None", prop: "Skateboard", pose: "Sitting", mood: "Confident", colorAccent: "Blue" },
    { id: 16, name: "Mujer con Lentes", height: "Medium", hair: "Brown", shirt: "Yellow", pants: "Pants", accessory: "Glasses", prop: "Book", pose: "Standing", mood: "Nervous", colorAccent: "Yellow" },
    { id: 17, name: "Niña con Coletas", height: "Short", hair: "Blonde", shirt: "Pink", pants: "Shorts", accessory: "Hat", prop: "Backpack", pose: "Sitting", mood: "Smug", colorAccent: "Red" },
    { id: 18, name: "Hombre con Gorra", height: "Tall", hair: "Brown", shirt: "Red", pants: "Pants", accessory: "Cap", prop: "Headphones", pose: "Standing", mood: "Nervous", colorAccent: "Orange" },
    { id: 19, name: "Mujer Mayor", height: "Short", hair: "Gray", shirt: "Green", pants: "Skirt", accessory: "Hat", prop: "Doll", pose: "Sitting", mood: "Calm", colorAccent: "Purple" },
    { id: 20, name: "Hombre Joven", height: "Medium", hair: "Black", shirt: "Blue", pants: "Pants", accessory: "Glasses", prop: "Tennis Racket", pose: "Leaning", mood: "Confident", colorAccent: "Blue" },
    { id: 21, name: "Mujer con Trenzas", height: "Medium", hair: "Brown", shirt: "Yellow", pants: "Shorts", accessory: "None", prop: "Bag", pose: "Standing", mood: "Happy", colorAccent: "Orange" },
    { id: 22, name: "Adolescente con Sudadera", height: "Tall", hair: "Black", shirt: "Blue", pants: "Shorts", accessory: "None", prop: "Skateboard", pose: "Sitting", mood: "Smug", colorAccent: "Blue" },
    { id: 23, name: "Mujer con Cola de Caballo", height: "Medium", hair: "Blonde", shirt: "Red", pants: "Pants", accessory: "Hat", prop: "Book", pose: "Standing", mood: "Nervous", colorAccent: "Red" },
    { id: 24, name: "Niña con Gorra", height: "Short", hair: "Black", shirt: "Pink", pants: "Shorts", accessory: "Cap", prop: "Doll", pose: "Sitting", mood: "Happy", colorAccent: "Yellow" },
    { id: 25, name: "Hombre con Barba", height: "Tall", hair: "Brown", shirt: "Green", pants: "Shorts", accessory: "None", prop: "Tennis Racket", pose: "Standing", mood: "Confident", colorAccent: "Brown" },
    { id: 26, name: "Mujer con Cabello Rizado", height: "Medium", hair: "Red", shirt: "Yellow", pants: "Jeans", accessory: "Gloves", prop: "Bag", pose: "Leaning", mood: "Nervous", colorAccent: "Orange" },
    { id: 27, name: "Niño con Medias Rayadas", height: "Short", hair: "Black", shirt: "Blue", pants: "Shorts", accessory: "None", prop: "Toy", pose: "Sitting", mood: "Smug", colorAccent: "Blue" },
    { id: 28, name: "Adolescente con Sombrero", height: "Medium", hair: "Blonde", shirt: "Red", pants: "Pants", accessory: "Hat", prop: "Backpack", pose: "Standing", mood: "Happy", colorAccent: "Red" },
    { id: 29, name: "Hombre Mayor con Lentes", height: "Tall", hair: "Gray", shirt: "Green", pants: "Shorts", accessory: "Glasses", prop: "Cane", pose: "Standing", mood: "Calm", colorAccent: "Brown" },
    { id: 30, name: "Niña con Trenzas", height: "Short", hair: "Black", shirt: "Pink", pants: "Skirt", accessory: "None", prop: "Doll", pose: "Sitting", mood: "Nervous", colorAccent: "Yellow" },
    { id: 31, name: "Hombre Joven con Sudadera", height: "Tall", hair: "Brown", shirt: "Blue", pants: "Pants", accessory: "Gloves", prop: "Book", pose: "Leaning", mood: "Confident", colorAccent: "Blue" },
    { id: 32, name: "Mujer con Cola de Caballo", height: "Medium", hair: "Black", shirt: "Yellow", pants: "Shorts", accessory: "Glasses", prop: "Bag", pose: "Standing", mood: "Smug", colorAccent: "Orange" },
    { id: 33, name: "Adolescente con Gorra", height: "Short", hair: "Brown", shirt: "Red", pants: "Shorts", accessory: "Cap", prop: "Skateboard", pose: "Sitting", mood: "Nervous", colorAccent: "Red" },
    { id: 34, name: "Niña con Bufanda", height: "Medium", hair: "Blonde", shirt: "Green", pants: "Pants", accessory: "Hat", prop: "Doll", pose: "Standing", mood: "Happy", colorAccent: "Purple" },
    { id: 35, name: "Hombre con Gafas de Sol", height: "Tall", hair: "Black", shirt: "Blue", pants: "Pants", accessory: "None", prop: "Tennis Racket", pose: "Leaning", mood: "Confident", colorAccent: "Blue" },
    { id: 36, name: "Mujer con Cabello Rizado", height: "Medium", hair: "Brown", shirt: "Pink", pants: "Shorts", accessory: "None", prop: "Backpack", pose: "Sitting", mood: "Smug", colorAccent: "Yellow" },
    { id: 37, name: "Niño con Sudadera", height: "Short", hair: "Black", shirt: "Blue", pants: "Shorts", accessory: "None", prop: "Toy", pose: "Standing", mood: "Nervous", colorAccent: "Blue" },
    { id: 38, name: "Mujer Mayor con Sombrero", height: "Short", hair: "Gray", shirt: "Yellow", pants: "Skirt", accessory: "Hat", prop: "Cane", pose: "Sitting", mood: "Calm", colorAccent: "Purple" },
    { id: 39, name: "Niña con Cola de Caballo", height: "Medium", hair: "Blonde", shirt: "Red", pants: "Pants", accessory: "None", prop: "Bag", pose: "Leaning", mood: "Happy", colorAccent: "Red" },
    { id: 40, name: "Hombre Joven con Barba", height: "Tall", hair: "Brown", shirt: "Green", pants: "Shorts", accessory: "None", prop: "Book", pose: "Standing", mood: "Confident", colorAccent: "Brown" }
];

// Categorías de preguntas disponibles
const QUESTION_CATEGORIES = {
    height: {
        name: "Altura",
        questions: [
            { text: "¿El ladrón es alto?", value: "Tall" },
            { text: "¿El ladrón es bajo?", value: "Short" },
            { text: "¿El ladrón es de estatura media?", value: "Medium" }
        ]
    },
    accessory: {
        name: "Accesorio",
        questions: [
            { text: "¿El ladrón lleva un accesorio?", value: "hasAccessory" },
            { text: "¿El ladrón lleva sombrero?", value: "Hat" },
            { text: "¿El ladrón lleva lentes?", value: "Glasses" },
            { text: "¿El ladrón lleva guantes?", value: "Gloves" },
            { text: "¿El ladrón lleva gorra?", value: "Cap" }
        ]
    },
    prop: {
        name: "Objeto",
        questions: [
            { text: "¿El ladrón lleva un objeto?", value: "hasProp" },
            { text: "¿El ladrón lleva un libro?", value: "Book" },
            { text: "¿El ladrón lleva una muñeca?", value: "Doll" },
            { text: "¿El ladrón lleva una raqueta?", value: "Tennis Racket" },
            { text: "¿El ladrón lleva una mochila?", value: "Backpack" }
        ]
    },
    pose: {
        name: "Pose",
        questions: [
            { text: "¿El ladrón está de pie?", value: "Standing" },
            { text: "¿El ladrón está sentado?", value: "Sitting" },
            { text: "¿El ladrón está apoyado?", value: "Leaning" }
        ]
    },
    mood: {
        name: "Estado de Ánimo",
        questions: [
            { text: "¿El ladrón está nervioso?", value: "Nervous" },
            { text: "¿El ladrón está confiado?", value: "Confident" },
            { text: "¿El ladrón está contento?", value: "Happy" },
            { text: "¿El ladrón está calmado?", value: "Calm" },
            { text: "¿El ladrón está presumido?", value: "Smug" }
        ]
    },
    colorAccent: {
        name: "Color de Acento",
        questions: [
            { text: "¿El ladrón tiene acento rojo?", value: "Red" },
            { text: "¿El ladrón tiene acento azul?", value: "Blue" },
            { text: "¿El ladrón tiene acento verde?", value: "Green" },
            { text: "¿El ladrón tiene acento amarillo?", value: "Yellow" },
            { text: "¿El ladrón tiene acento naranja?", value: "Orange" },
            { text: "¿El ladrón tiene acento morado?", value: "Purple" },
            { text: "¿El ladrón tiene acento marrón?", value: "Brown" }
        ]
    },
    shirt: {
        name: "Camisa",
        questions: [
            { text: "¿El ladrón lleva camisa azul?", value: "Blue" },
            { text: "¿El ladrón lleva camisa roja?", value: "Red" },
            { text: "¿El ladrón lleva camisa verde?", value: "Green" },
            { text: "¿El ladrón lleva camisa amarilla?", value: "Yellow" },
            { text: "¿El ladrón lleva camisa rosa?", value: "Pink" }
        ]
    },
    pants: {
        name: "Pantalones",
        questions: [
            { text: "¿El ladrón lleva shorts?", value: "Shorts" },
            { text: "¿El ladrón lleva pantalones?", value: "Pants" },
            { text: "¿El ladrón lleva falda?", value: "Skirt" },
            { text: "¿El ladrón lleva jeans?", value: "Jeans" }
        ]
    }
};

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHARACTERS, QUESTION_CATEGORIES };
}

