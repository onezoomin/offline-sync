import post from 'axios'
import Dexie from 'dexie'
import 'dexie-observable'
import 'dexie-syncable'

export const registerSyncProtocol = () => {
  Dexie.Syncable.registerSyncProtocol('todo_sync_protocol', {
    async sync (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) {
    /// <param name="context" type="IPersistedContext"></param>
    /// <param name="url" type="String"></param>
    /// <param name="changes" type="Array" elementType="IDatabaseChange"></param>
    /// <param name="applyRemoteChanges" value="function (changes, lastRevision, partial, clear) {}"></param>
    /// <param name="onSuccess" value="function (continuation) {}"></param>
    /// <param name="onError" value="function (error, again) {}"></param>

      const POLL_INTERVAL = 10000 // Poll every 10th second

      // In this example, the server expects the following JSON format of the request:
      //  {
      //      [clientIdentity: unique value representing the client identity. If omitted, server will return a new client identity in its response that we should apply in next sync call.]
      //      baseRevision: baseRevision,
      //      partial: partial,
      //      changes: changes,
      //      syncedRevision: syncedRevision
      //  }
      //  To keep the sample simple, we assume the server has the exact same specification of how changes are structured.
      //  In real world, you would have to pre-process the changes array to fit the server specification.
      //  However, this example shows how to deal with ajax to fulfil the API.
      const request = {
        clientIdentity: context.clientIdentity || null,
        baseRevision,
        partial,
        changes,
        syncedRevision,
      }

      try {
        const { data } = await post(url, {
          method: 'POST',
          data: request,
          // contentType: 'application/json', // Make sure we set the correct content-type header as some servers expect this
          // dataType: 'json',
          // data: JSON.stringify(request),
          // error (xhr, textStatus) {
          // Network down, server unreachable or other failure. Try again in POLL_INTERVAL seconds.
          //   onError(textStatus, POLL_INTERVAL)
          // },
          // success (data) {
          // In this example, the server response has the following format:
          // {
          //     success: true / false,
          //     errorMessage: "",
          //     changes: changes,
          //     currentRevision: revisionOfLastChange,
          //     needsResync: false, // Flag telling that server doesn't have given syncedRevision or of other reason wants client to resync. ATTENTION: this flag is currently ignored by Dexie.Syncable
          //     partial: true / false, // The server sent only a part of the changes it has for us. On next resync it will send more based on the clientIdentity
          //     [clientIdentity: unique value representing the client identity. Only provided if we did not supply a valid clientIdentity in the request.]
          // }
          // },
        })
        console.log(data)
        if (!data.success) {
          onError(data.errorMessage, Infinity) // Infinity = Don't try again. We would continue getting this error.
        } else if ('clientIdentity' in data) {
          context.clientIdentity = data.clientIdentity
          // Make sure we save the clientIdentity sent by the server before we try to resync.
          // If saving fails we wouldn't be able to do a partial synchronization
          context.save()
            .then(async () => {
            // Since we got success, we also know that server accepted our changes:
              onChangesAccepted()
              // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
              await applyRemoteChanges(data.changes, data.currentRevision, data.partial, data.needsResync)
              onSuccess({ again: POLL_INTERVAL })
            })
            .catch((e) => {
            // We didn't manage to save the clientIdentity stop synchronization
              onError(e, Infinity)
            })
        } else {
        // Since we got success, we also know that server accepted our changes:
          onChangesAccepted()
          // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
          await applyRemoteChanges(data.changes, data.currentRevision, data.partial, data.needsResync)
          onSuccess({ again: POLL_INTERVAL })
        }
      } catch (err) {
        // Handle Error Here
        console.error(err)
        onError(err)
      }
    },
  })
}

const initialSyncPayload = {
  clientIdentity: null,
  baseRevision: null,
  partial: false,
  changes: [
    {
      type: 1,
      table: 'ActiveTasks',
      key: [
        1644768021903,
        '0x123',
      ],
      obj: {
        task: 'init task1',
        status: 'Active',
        ts: 1644768021903,
        user: '0x123',
      },
    },
    {
      type: 1,
      table: 'ActiveTasks',
      key: [
        1644768021903.3,
        '0x123',
      ],
      obj: {
        task: 'init task2',
        status: 'Active',
        ts: 1644768021903.3,
        user: '0x123',
      },
    },
    {
      type: 1,
      table: 'CompletedTasks',
      key: [
        1644768021903.5,
        '0x123',
      ],
      obj: {
        task: 'finished task1',
        status: 'Completed',
        ts: 1644768021903.5,
        user: '0x123',
      },
    },
  ],
  syncedRevision: null,
}
