import json
import logging
import httpx
from aiokafka import AIOKafkaConsumer
from src.conf import get_settings
from src.indexer.sync_content import index_material, remove_material_document

logger = logging.getLogger(__name__)
settings = get_settings()


def _content_headers() -> dict:
    h = {}
    if settings.SEARCH_INDEX_SECRET:
        h["X-Search-Index"] = settings.SEARCH_INDEX_SECRET
    return h


async def start_kafka_consumer(app):
    """Listen for material events and keep search index in sync with content_service."""
    consumer = AIOKafkaConsumer(
        "material.created",
        "material.updated",
        "material.deleted",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="search_service",
        auto_offset_reset="latest",
        value_deserializer=lambda m: json.loads(m.decode()),
    )
    try:
        await consumer.start()
        logger.info(
            "Kafka consumer started (topics: material.created, material.updated, material.deleted)"
        )
        async for msg in consumer:
            try:
                topic = msg.topic
                data = msg.value
                material_id = data.get("material_id")
                if not material_id:
                    continue

                if topic == "material.deleted":
                    doc_id = f"doc-mat-{material_id}"
                    logger.info(f"Removing search index for deleted material {material_id}")
                    await remove_material_document(app, doc_id)
                    continue

                logger.info(f"Kafka {topic}: re-index material {material_id}")
                async with httpx.AsyncClient(timeout=30.0, headers=_content_headers()) as client:
                    resp = await client.get(
                        f"{settings.CONTENT_SERVICE_URL}/api/materials/{material_id}"
                    )
                    if resp.status_code == 404:
                        doc_id = f"doc-mat-{material_id}"
                        await remove_material_document(app, doc_id)
                        continue
                    resp.raise_for_status()
                    material = resp.json()

                    les_resp = await client.get(
                        f"{settings.CONTENT_SERVICE_URL}/api/materials/{material_id}/lessons/"
                    )
                    les_resp.raise_for_status()
                    material["_lessons"] = les_resp.json()

                try:
                    await index_material(app, material)
                finally:
                    # Same as startup sync: rebuild even if indexing raised after bm25 add_document.
                    app.state.bm25_index.rebuild()
            except Exception as e:
                logger.error(f"Error processing Kafka message: {e}")
    except Exception as e:
        logger.error(f"Kafka consumer error: {e}")
    finally:
        await consumer.stop()
