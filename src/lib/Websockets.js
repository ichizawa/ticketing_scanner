import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import {
    Pusher,
    PusherMember,
    PusherChannel,
    PusherEvent,
} from '@pusher/pusher-websocket-react-native';

export async function Websockets(channel, events, callback) {
    const pusher = Pusher.getInstance();

    await pusher.init({
        apiKey: '520d86ca82ea50c00604',
        cluster: 'ap1',
    });

    await pusher.connect();

    await pusher.subscribe({
        channelName: channel,
        onEvent: (event) => {
            // Filter event name(s)
            // console.info("from main pusher: ", event);
            const eventNames = Array.isArray(events) ? events : [events];
            if (eventNames.includes(event.eventName)) {
                callback?.(event);
            }
        },
    });
}
