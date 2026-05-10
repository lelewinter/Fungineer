/** HubData — Static data for hub rooms, NPCs, and zone metadata.
 *  Phase 1 stub: returns empty results. Phase 2 will populate this from the
 *  Godot HubData.gd port. */

export interface HubRoom {
  id: string;
  name: string;
  description?: string;
  npc_ids?: string[];
  zone_id?: string;
}

export interface HubNpc {
  id: string;
  display_name: string;
  room_id: string;
}

export interface HubZone {
  id: string;
  name: string;
  texture?: string;
  scene?: string;
}

export const HubData = {
  getRoom(_id: string): HubRoom | undefined {
    return undefined;
  },
  getNpc(_id: string): HubNpc | undefined {
    return undefined;
  },
  getZone(_id: string): HubZone | undefined {
    return undefined;
  },
  getNpcsInRoom(_roomId: string): HubNpc[] {
    return [];
  },
  allRooms(): HubRoom[] {
    return [];
  },
  allNpcs(): HubNpc[] {
    return [];
  },
  allZones(): HubZone[] {
    return [];
  },
};
