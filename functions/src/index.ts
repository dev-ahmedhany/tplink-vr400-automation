
import * as functions from "firebase-functions";

import admin = require("firebase-admin")
admin.initializeApp();

const db = admin.firestore();

import scrapeWebsite from "./pptr";

exports.scrape = functions
    .runWith({
      timeoutSeconds: 120,
      memory: "2GB",
    })
    .region("europe-west1").firestore
    .document("/usage/{timestamp}")
    .onCreate(async (change, context) => {
      let data;
      let fetched = false;
      try {
        data = await scrapeWebsite();
        fetched = true;
      } catch (error) {
        data = JSON.stringify(error);
      }
      await db
          .collection("usage")
          .doc(context.params.timestamp)
          .update({
            fetched,
            fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
            data,
          });
    });

exports.scrapingSchedule = functions.pubsub
    .schedule("0 * * * *")
    .timeZone("Africa/Cairo")
    .onRun(async () => {
      const time = (new Date()).getTime().toFixed(0);
      await db
          .collection("usage")
          .doc(time)
          .create({
            fetched: false,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      return null;
    });
