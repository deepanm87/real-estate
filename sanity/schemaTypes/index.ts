import { type SchemaTypeDefinition } from 'sanity'
import { agent } from './agent'
import { amenity } from './amenity'
import { lead } from './lead'
import { property } from './property'
import { user } from './user'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [property, agent, lead, user, amenity],
}
