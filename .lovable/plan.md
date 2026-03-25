

## Plan : Connecter le frontend au système event_outbox

### Contexte
La table `event_outbox` existe maintenant en DB avec des triggers sur `products`, `orders`, `customers` et `pricing_rules`. Le hook `useEventOutbox.ts` existe déjà mais référence une Edge Function `event-bus-processor` qui doit être alignée.

### Étapes

**1. Mettre à jour le hook `useEventOutbox.ts`**
- Aligner l'interface `OutboxEvent` avec le schéma réel de la table (vérifier les colonnes `payload` vs `old_data`/`new_data`)
- S'assurer que le realtime subscription pointe sur `event_outbox`

**2. Créer/mettre à jour l'Edge Function `event-bus-processor`**
- Traiter les événements `pending` par lots (batch de 25)
- Router vers les services appropriés selon `aggregate_type` (orders → order-hub, products → pricing pipeline)
- Implémenter le DLQ : après 3 échecs → status `dlq`
- Action `stats` : compter par status/event_type
- Action `dlq_retry` : remettre les événements DLQ en `pending`
- Action `cleanup` : purger les événements `completed` > N jours

**3. Ajouter le trigger sur `pricing_rules`**
- Le SQL exécuté ne contenait que products/orders/customers
- Ajouter le trigger manquant via SQL editor

**4. Activer Realtime sur `event_outbox`**
- Migration : `ALTER PUBLICATION supabase_realtime ADD TABLE public.event_outbox;`

### Fichiers modifiés
| Fichier | Action |
|---|---|
| `src/hooks/useEventOutbox.ts` | Aligner types avec schéma réel |
| `supabase/functions/event-bus-processor/index.ts` | Créer/refactorer le processeur |

### SQL supplémentaire (à coller dans l'éditeur)
```sql
-- Trigger pricing_rules
CREATE TRIGGER outbox_pricing_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.emit_outbox_event();

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_outbox;
```

