import { Map, Set } from 'immutable'
import { SignalData } from 'simple-peer'
import { WRTC } from '@koush/wrtc'

import { Peer } from './peer'
import { PeerID } from './types'

// TODO cleanup old peers

export class PeerPool {
  private peers = Map<PeerID, Peer>()

  private constructor (
    private readonly id: PeerID,
    private readonly wrtc?: WRTC
  ) {}

  static async init (id: PeerID): Promise<PeerPool> {
    // needed on node
    let wrtc: WRTC | undefined
    try {
      // resolve relatively to where it is run, not from discojs dir
      const path = require.resolve('@koush/wrtc', { paths: ['.'] })
      wrtc = await import(path)
    } catch (e) {
      // expected
    }

    return new PeerPool(id, wrtc)
  }

  shutdown (): void {
    console.debug(this.id, 'shutdown their peers')

    this.peers.forEach((peer) => peer.destroy())
    this.peers = Map()
  }

  signal (peerID: PeerID, signal: SignalData): void {
    console.debug(this.id, 'signals for', peerID)

    const peer = this.peers.get(peerID)
    if (peer === undefined) {
      throw new Error(`received signal for unknown peer: ${peerID}`)
    }

    peer.signal(signal)
  }

  async getPeers (
    peersToConnect: Set<PeerID>,
    // TODO as event?
    onNewPeer: (id: PeerID, peer: Peer) => void
  ): Promise<Map<PeerID, Peer>> {
    if (peersToConnect.contains(this.id)) {
      throw new Error('peers to connect contains our id')
    }

    console.debug(this.id, 'is connecting peers:', peersToConnect.toJS())

    const newPeers = Map(peersToConnect
      .filter((id) => !this.peers.has(id))
      .map((id) => [id, id < this.id] as [number, boolean])
      .map(([id, initiator]) => [id, new Peer({ initiator, wrtc: this.wrtc })]))

    console.debug(this.id, 'asked to connect new peers:', newPeers.keySeq().toJS())

    this.peers = this.peers.merge(newPeers)
    newPeers
      .forEach((peer, id) => onNewPeer(id, peer))

    // TODO cleanup?
    newPeers.forEach((peer, id) =>
      peer.on('close', () => console.warn(this.id, 'peer', id, 'closed connection')))

    await Promise.all(
      newPeers
        .entrySeq()
        .map(async ([id, peer]) => [
          id,
          await new Promise((resolve) => {
            peer.on('connect', () => {
              console.debug(this.id, 'connected new peer', id)
              resolve(peer)
            })
          })
        ] as [PeerID, Peer]))

    console.debug(this.id, 'knowns connected peers:', this.peers.keySeq().toJS())

    return this.peers
      .filter((_, id) => peersToConnect.has(id))
  }
}