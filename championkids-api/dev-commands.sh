#!/bin/bash
# ChampionKids local dev commands

case "$1" in
  start)
    docker start ck-mongo
    echo "MongoDB started"
    ;;
  stop)
    docker stop ck-mongo
    echo "MongoDB stopped"
    ;;
  status)
    docker ps | grep ck-mongo || echo "ck-mongo is not running"
    ;;
  logs)
    docker logs ck-mongo --tail 20
    ;;
  shell)
    docker exec -it ck-mongo mongosh championkids_dev
    ;;
  reset-db)
    echo "WARNING: This drops all data. Ctrl+C to cancel."
    sleep 3
    docker exec ck-mongo mongosh championkids_dev \
      --eval "db.dropDatabase()" --quiet
    echo "Database dropped. Re-run seed scripts."
    ;;
  *)
    echo "Usage: ./dev-commands.sh [start|stop|status|logs|shell|reset-db]"
    ;;
esac
