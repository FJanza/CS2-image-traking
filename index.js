import fs from "fs";
import {Skins} from "./skins.js";
import {readFile} from "fs/promises";
import {createClient} from "@supabase/supabase-js";
import {descargarImagen} from "./image-downloader.js";

const ObtainSkins = async () => {
  const STATES = ["heavy", "medium", "light"];

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  function convertirFases(cadena) {
    // Encuentra todas las instancias de "Phase" seguido por un número y reemplázalo por "Phase $1"
    return cadena.replace(/Phase(\d+)/g, "Phase $1");
  }

  // Skins en crudo
  const rawSkins = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/skins.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de Skins
  const newSkins = rawSkins
    .map((skin) => {
      return STATES.map((state) => {
        return {
          name:
            skin.pattern?.name === "Doppler"
              ? skin.pattern.id.split("_")[1] === "doppler"
                ? skin.name +
                  " " +
                  convertirFases(
                    skin.pattern.id.split("_")[2].charAt(0).toUpperCase() +
                      skin.pattern.id.split("_")[2].slice(1)
                  )
                : skin.name +
                  " " +
                  skin.pattern.id.split("_")[1].charAt(0).toUpperCase() +
                  skin.pattern.id.split("_")[1].slice(1)
              : skin.pattern?.name === "Gamma Doppler"
              ? skin.pattern.id.split("_")[1] === "emerald"
                ? skin.name +
                  " " +
                  skin.pattern.id.split("_")[1].charAt(0).toUpperCase() +
                  skin.pattern.id.split("_")[1].slice(1)
                : skin.name +
                  " " +
                  convertirFases(
                    skin.pattern.id.split("_")[3].charAt(0).toUpperCase() +
                      skin.pattern.id.split("_")[3].slice(1)
                  )
              : skin.name,
          type: "skin",
          rarity: {
            name: skin.rarity.name,
            color: skin.rarity.color,
          },
          img: skin.image.replace(
            skin.image.split("_")[skin.image.split("_").length - 2],
            state
          ),
          state: state,
        };
      });
    })
    .flat();

  // Agentes en crudo
  const rawAgents = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/agents.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de Agentes
  const newAgents = rawAgents.map((agent) => {
    return {
      name: agent.name,
      rarity: {
        name: agent.rarity.name,
        color: agent.rarity.color,
      },
      type: "other",
      team: agent.team.name,
      img: agent.image,
    };
  });

  // MusicKits en crudo
  const rawMusicKits = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/music_kits.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de MusicKits
  const newMusicKits = rawMusicKits
    .map((kit) => {
      return {
        name: kit.name,
        rarity: {
          name: kit.rarity.name,
          color: kit.rarity.color,
        },
        type: "other",
        img: kit.image,
      };
    })
    .filter((kit) => !kit.name.includes("StatTrak"));

  // Pines en crudo
  const rawCollectibles = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/collectibles.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de Pines

  const newCollectibles = rawCollectibles
    .map((collectible) => {
      return {
        name: collectible.name,
        rarity: {
          name: collectible.rarity.name,
          color: collectible.rarity.color,
        },
        type: collectible.type,
        img: collectible.image,
      };
    })
    .filter((collectible) => collectible.type === "Pin")
    .map((collectible) => {
      return {...collectible, type: "other"};
    });

  // Parches en crudo
  const rawPatches = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/patches.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de Parches

  const newPatches = rawPatches.map((patch) => {
    return {
      name: patch.name,
      rarity: {
        name: patch.rarity.name,
        color: patch.rarity.color,
      },
      type: "other",
      img: patch.image,
    };
  });

  // Stickers en crudo

  const rawStickers = JSON.parse(
    await fetch(
      "https://bymykel.github.io/CSGO-API/api/en/stickers.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => console.error(error))
  );

  // Limpieza y estandarizacion de Stickers

  const newStickers = rawStickers.map((sticker) => {
    return {
      name: sticker.name,
      rarity: {
        name: sticker.rarity.name,
        color: sticker.rarity.color,
      },
      type: "other",
      img: sticker.image,
    };
  });

  const allKeys = [
    ...newSkins,
    ...newAgents,
    ...newCollectibles,
    ...newPatches,
    ...newMusicKits,
    // ...newStickers,
  ].map((item) => {
    return {name: item.name, type: item.type};
  });

  // Paso 1: Utiliza un conjunto para almacenar objetos únicos
  let conjunto = new Set();

  // Paso 2: Itera sobre el array original y agrega cada objeto al conjunto
  let keysSinRepetidos = JSON.stringify(
    allKeys.filter((objeto) => {
      // Convierte cada objeto en una cadena para poder usarlo como clave en el conjunto
      let objetoString = JSON.stringify(objeto);
      // Si el objeto no está en el conjunto, agrégalo y devuelve verdadero
      if (!conjunto.has(objetoString)) {
        conjunto.add(objetoString);
        return true;
      }
      // Si el objeto ya está en el conjunto, devuelve falso para filtrarlo
      return false;
    })
  );

  const allJson = JSON.stringify([
    ...newSkins,
    ...newAgents,
    ...newCollectibles,
    ...newPatches,
    ...newMusicKits,
    // ...newStickers,
  ]);

  // Escribir el archivo JSON keys
  fs.writeFile("keys.json", keysSinRepetidos, "utf8", (err) => {
    if (err) {
      console.error("Error al escribir el archivo:", err);
    }
    console.log("Archivo JSON escrito correctamente");
  });
  // Escribir el archivo JSON Skins
  fs.writeFile("all.json", allJson, "utf8", (err) => {
    if (err) {
      console.error("Error al escribir el archivo:", err);
    }
    console.log("Archivo JSON escrito correctamente");
  });

  // conseguimos un json con todos los skins pero con las imagenes guardadas por otros

  saveImages(); //guardamos las imagenes
};

//TODO revisar como se suben los archivos

const saveImages = async () => {
  // const supabase = createClient(
  //   "https://yevuxcdmvhmtjmnunknm.supabase.co",
  //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldnV4Y2RtdmhtdGptbnVua25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ1MTE1MzIsImV4cCI6MjAzMDA4NzUzMn0.ssDmQRd3aVTTcOOdE9xh7pUN-LVuQ7mu8nSNAVOk9Mk"
  // );

  // async function uploadFile(fileName, fileContent, index) {
  //   const {data, error} = await supabase.storage
  //     .from("Skins")
  //     .upload(fileName, fileContent, {
  //       contentType: "image/png",
  //     });
  //   if (error) {
  //     console.log(index);
  //   } else {
  //     console.log(data);
  //   }
  // }

  // Create a single supabase client for interacting with your database

  const file = await readFile("./all.json", "utf-8");

  // transformamos el contenido en un JSON
  const skins = JSON.parse(file);

  for (let index = 0; index < skins.length; index++) {
    const filaeName = `${skins[index].name
      .replaceAll(" | ", "_")
      .replaceAll(" ", "_")
      .replaceAll("-", "_")
      .replaceAll("*", "_")
      .replaceAll(",", "")}${
      skins[index].state ? "_" + skins[index].state : ""
    }.png`.replace(" ", "");

    // if (filaeName.includes("Music_Kit_Sean_Murray_A*D*8")) console.log(index);

    const filePath = `download/${filaeName}`;

    await descargarImagen(skins[index].img, filePath);

    // if (d !== 0) {
    //   const fileContent = await readFile(filePath);
    //   await uploadFile(filaeName, fileContent, index);
    //   console.log(`${skins[index].name} subido`);
    //   fs.unlinkSync(filePath);
    // }
  }
};

ObtainSkins();
