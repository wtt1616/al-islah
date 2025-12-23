#!/usr/bin/env bash
# Idempotent migration: add created_by and modified_by to schedules
# Usage: ./scripts/add_schedules_columns.sh

DB=isar
USER=myopensoft-isar

read -s -p "MySQL password for $USER: " PWD
echo

has_col() {
  mysql -u"$USER" -p"$PWD" -N -s -e \
  "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${DB}' AND TABLE_NAME='schedules' AND COLUMN_NAME='$1';"
}

if [ "$(has_col created_by)" -eq 0 ]; then
  echo "Adding column created_by ..."
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD COLUMN created_by INT DEFAULT NULL;"
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD KEY created_by (created_by);"
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD CONSTRAINT schedules_ibfk_3 FOREIGN KEY (created_by) REFERENCES ${DB}.users(id);" || echo "Warning: couldn't add FK schedules_ibfk_3; please inspect."
else
  echo "Column created_by already exists — skipping"
fi

if [ "$(has_col modified_by)" -eq 0 ]; then
  echo "Adding column modified_by ..."
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD COLUMN modified_by INT DEFAULT NULL;"
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD KEY modified_by (modified_by);"
  mysql -u"$USER" -p"$PWD" -e "ALTER TABLE ${DB}.schedules ADD CONSTRAINT schedules_ibfk_4 FOREIGN KEY (modified_by) REFERENCES ${DB}.users(id);" || echo "Warning: couldn't add FK schedules_ibfk_4; please inspect."
else
  echo "Column modified_by already exists — skipping"
fi

echo "Migration finished."
